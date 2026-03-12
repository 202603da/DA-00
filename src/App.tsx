import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Download, Copy, Info, X, FolderInput, Play, Music, FileText, Hash, Eye, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset } from './types';
import { api } from './lib/api';

export default function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>(''); // '' for all, 'image', 'audio'
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [relatedAssets, setRelatedAssets] = useState<Asset[]>([]);
  const [importing, setImporting] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastAssetElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    loadAssets(true);
  }, [search, filterType]);

  useEffect(() => {
    if (page > 1) {
      loadAssets(false);
    }
  }, [page]);

  const loadAssets = async (reset: boolean) => {
    setLoading(true);
    try {
      const data = await api.getAssets(reset ? 1 : page, search, filterType);
      if (reset) {
        setAssets(data);
        setPage(1);
      } else {
        setAssets(prev => [...prev, ...data]);
      }
      setHasMore(data.length > 0);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await api.importFolder('\\\\10.112.57.53\\DHome\\Digital Appliances_2\\UE5_SET\\AI 에셋 저장소');
      loadAssets(true);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const openDetail = async (asset: Asset) => {
    setSelectedAsset(asset);
    try {
      const updatedAsset = await api.incrementView(asset.id);
      setSelectedAsset(updatedAsset);
      // Update the asset in the list as well
      setAssets(prev => prev.map(a => a.id === asset.id ? updatedAsset : a));
      
      const related = await api.getRelatedAssets(asset.id);
      setRelatedAssets(related);
    } catch (error) {
      console.error('Failed to load related assets:', error);
    }
  };

  const handleLike = async (id: number) => {
    try {
      const updatedAsset = await api.incrementLike(id);
      setSelectedAsset(updatedAsset);
      setAssets(prev => prev.map(a => a.id === id ? updatedAsset : a));
    } catch (error) {
      console.error('Failed to increment like:', error);
    }
  };

  const closeDetail = () => {
    setSelectedAsset(null);
    setRelatedAssets([]);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Simple feedback could be added here
  };

  const goHome = () => {
    setSearch('');
    setFilterType('');
    setPage(1);
    setSelectedAsset(null);
    setShowFullScreen(false);
    setDownloadStarted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-6 py-4 flex flex-col gap-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8 flex-1">
            <button 
              onClick={goHome}
              className="text-xl font-bold tracking-tight whitespace-nowrap hover:opacity-70 transition-opacity" 
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              DA Asset Library
            </button>
            
            <div className="relative max-w-2xl w-full flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by filename, keywords, prompt, or type..."
                  className="w-full bg-gray-100 border-none rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-black/5 transition-all outline-none text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <FolderInput className="w-4 h-4" />
                {importing ? 'Importing...' : 'Import Folder'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 px-2">
          <button
            onClick={() => setFilterType('')}
            className={`text-sm font-bold transition-colors ${filterType === '' ? 'text-black border-b-2 border-black pb-1' : 'text-gray-400 hover:text-gray-600'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`text-sm font-bold transition-colors ${filterType === 'image' ? 'text-black border-b-2 border-black pb-1' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Images
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`text-sm font-bold transition-colors ${filterType === 'audio' ? 'text-black border-b-2 border-black pb-1' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Music
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {assets.map((asset, index) => (
            <motion.div
              key={`${asset.id}-${index}`}
              ref={index === assets.length - 1 ? lastAssetElementRef : null}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index % 10 * 0.05 }}
              onClick={() => openDetail(asset)}
              className="break-inside-avoid group relative cursor-zoom-in rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all"
            >
              <img
                src={asset.thumbnail}
                alt={asset.filename}
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white text-xs font-medium truncate drop-shadow-md flex-1">
                    {asset.filename}
                  </span>
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-1 text-white drop-shadow-md">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{asset.views}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white drop-shadow-md">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{asset.likes}</span>
                    </div>
                    {asset.type === 'video' && <Play className="w-4 h-4 text-white fill-white" />}
                    {asset.type === 'audio' && <Music className="w-4 h-4 text-white" />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = asset.url;
                        link.download = asset.filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      title="Download"
                      className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors backdrop-blur-sm"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          >
            <div className="w-full h-full overflow-y-auto pt-20">
              <div className="max-w-7xl mx-auto p-6 lg:p-12">
                {/* Modal Header */}
                <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100 z-50">
                  <button 
                    onClick={goHome}
                    className="text-xl font-bold tracking-tight whitespace-nowrap hover:opacity-70 transition-opacity" 
                    style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                  >
                    DA Asset Library
                  </button>
                  <button
                    onClick={closeDetail}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left: Content Preview */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="rounded-3xl overflow-hidden bg-gray-50 flex items-center justify-center min-h-[400px] lg:min-h-[600px] shadow-inner">
                      {selectedAsset.type === 'image' && (
                        <img
                          src={selectedAsset.url}
                          alt={selectedAsset.filename}
                          className="max-w-full max-h-[80vh] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {selectedAsset.type === 'video' && (
                        <video
                          src={selectedAsset.url}
                          controls
                          className="max-w-full max-h-[80vh]"
                        />
                      )}
                      {selectedAsset.type === 'audio' && (
                        <div className="flex flex-col items-center gap-6 p-12">
                          <div className="w-32 h-32 bg-black rounded-full flex items-center justify-center">
                            <Music className="w-12 h-12 text-white" />
                          </div>
                          <audio src={selectedAsset.url} controls className="w-full max-w-md" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{selectedAsset.filename}</h2>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(selectedAsset.keywords.split(','))).map((tag, idx) => (
                              <span key={`${tag}-${idx}`} className="text-sm font-medium text-gray-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pt-1">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Eye className="w-5 h-5" />
                            <span className="text-sm font-bold">{selectedAsset.views.toLocaleString()}</span>
                          </div>
                          <button 
                            onClick={() => handleLike(selectedAsset.id)}
                            className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors group"
                          >
                            <Heart className="w-5 h-5 group-hover:fill-red-500" />
                            <span className="text-sm font-bold">{selectedAsset.likes.toLocaleString()}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-3">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Prompt</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed italic">
                          "{selectedAsset.prompt}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & Info */}
                  <div className="lg:col-span-4 space-y-8">
                    <div className="sticky top-12 space-y-8">
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => setShowFullScreen(true)}
                          className="flex items-center justify-center gap-3 bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
                        >
                          <Download className="w-5 h-5" />
                          Download Asset
                        </button>
                        <button
                          onClick={() => copyToClipboard(selectedAsset.prompt, 'Prompt')}
                          className="flex items-center justify-center gap-3 bg-gray-100 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        >
                          <Copy className="w-5 h-5" />
                          Copy Prompt
                        </button>
                        <button
                          onClick={() => copyToClipboard(selectedAsset.keywords.split(',').map(k => `#${k}`).join(' '), 'Keywords')}
                          className="flex items-center justify-center gap-3 bg-gray-100 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        >
                          <Hash className="w-5 h-5" />
                          Copy Keywords
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Info className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Asset Information</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white border border-gray-100 rounded-xl">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Format</p>
                            <p className="font-bold">{selectedAsset.format}</p>
                          </div>
                          <div className="p-4 bg-white border border-gray-100 rounded-xl">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Resolution</p>
                            <p className="font-bold">{selectedAsset.resolution}</p>
                          </div>
                          <div className="p-4 bg-white border border-gray-100 rounded-xl col-span-2">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Creation Tool</p>
                            <p className="font-bold">{selectedAsset.tool}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Related Assets */}
                <div className="mt-24 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Related Assets</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {relatedAssets.map((asset, idx) => (
                      <div
                        key={`${asset.id}-${idx}`}
                        onClick={() => openDetail(asset)}
                        className="group cursor-pointer space-y-2"
                      >
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                          <img
                            src={asset.thumbnail}
                            alt={asset.filename}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-xs font-medium truncate">{asset.filename}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Preview Overlay */}
      <AnimatePresence>
        {showFullScreen && selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            {/* Header in Full Screen */}
            <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between z-[110]">
              <button 
                onClick={goHome}
                className="text-xl font-bold tracking-tight whitespace-nowrap text-white hover:opacity-70 transition-opacity" 
                style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
              >
                DA Asset Library
              </button>
              <button
                onClick={() => {
                  setShowFullScreen(false);
                  setDownloadStarted(false);
                }}
                className="p-4 text-white hover:bg-white/20 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="w-full h-full flex flex-col items-center justify-center p-8 lg:p-16 gap-10">
              <div className="flex-1 flex items-center justify-center w-full min-h-0">
                {selectedAsset.type === 'image' && (
                  <img
                    src={selectedAsset.url}
                    alt={selectedAsset.filename}
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                )}
                {selectedAsset.type === 'video' && (
                  <video
                    src={selectedAsset.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-full shadow-2xl rounded-lg"
                  />
                )}
                {selectedAsset.type === 'audio' && (
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center">
                      <Music className="w-24 h-24 text-white" />
                    </div>
                    <audio src={selectedAsset.url} controls autoPlay className="w-full max-w-xl" />
                  </div>
                )}
              </div>

              {/* Confirm Download Button or Success Message */}
              <div className="flex-shrink-0">
                {!downloadStarted ? (
                  <a
                    href={selectedAsset.url}
                    download={selectedAsset.filename}
                    onClick={() => setDownloadStarted(true)}
                    className="flex items-center gap-3 bg-white text-black px-12 py-4 rounded-full font-bold hover:bg-gray-200 transition-all shadow-xl text-lg"
                  >
                    <Download className="w-6 h-6" />
                    Confirm Download
                  </a>
                ) : (
                  <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-3 shadow-lg relative pr-12">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      Download Started
                      <button 
                        onClick={() => {
                          setShowFullScreen(false);
                          setDownloadStarted(false);
                        }}
                        className="absolute right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setShowFullScreen(false);
                        setDownloadStarted(false);
                      }}
                      className="text-white/60 hover:text-white text-sm font-medium underline underline-offset-4 transition-colors"
                    >
                      Close Preview
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
