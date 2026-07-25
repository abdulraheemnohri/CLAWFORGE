import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { BookOpen, Search, UploadCloud, Trash2, FileText, CheckCircle, RefreshCw, Layers, Database } from 'lucide-react';

export const RAGKnowledge: React.FC = () => {
  const { v3Documents, fetchV3Documents, uploadV3Document, deleteV3Document, queryV3Rag } = useClawForgeStore();

  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('pdf');
  const [queryText, setQueryText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchV3Documents();
  }, [fetchV3Documents]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;
    setUploading(true);
    await uploadV3Document(docName, docType, 'default');
    setDocName('');
    setTimeout(() => {
      setUploading(false);
    }, 1000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText) return;
    setSearching(true);
    const res = await queryV3Rag(queryText);
    setSearchResults(res.results || []);
    setSearching(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="text-orange-500 w-7 h-7" />
            RAG Knowledge System
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Modular semantic search, parser engines, document chunking, and incremental vector index store.
          </p>
        </div>
        <button
          onClick={() => fetchV3Documents()}
          className="p-2 bg-gray-900/40 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: file management list */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Knowledge Base */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Database className="text-orange-500 w-5 h-5" />
              Source Documents Pipeline
            </h2>

            <div className="space-y-3">
              {v3Documents.map((doc) => (
                <div key={doc.id} className="bg-gray-950/80 border border-gray-850 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-orange-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{doc.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span className="uppercase">{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '12 KB'}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] bg-gray-900 px-1.5 py-0.5 rounded text-orange-400">
                          {doc.chunkCount} Vector Chunks
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1.5 ${
                      doc.status === 'indexed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {doc.status === 'indexed' ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span>Ready</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                          <span>Parsing</span>
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => deleteV3Document(doc.id)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Semantic Search Sandbox */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Search className="text-orange-500 w-5 h-5" />
              Retriever Semantic Test
            </h2>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Query semantic chunks (e.g., 'system orchestration policies')"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="flex-1 bg-gray-950 border border-gray-850 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2.5 text-sm text-white"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-orange-600 hover:bg-orange-500 text-white px-5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
              >
                {searching ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Search className="w-4 h-4" />}
                <span>Retrieve Context</span>
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-3.5 border-t border-gray-900 pt-4 animate-fade-in">
                <p className="text-xs text-orange-500 font-medium tracking-wide uppercase">Matched Knowledge Nodes:</p>
                {searchResults.map((res, index) => (
                  <div key={index} className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-orange-400/80 font-semibold font-mono">{res.citation}</span>
                      <span className="text-gray-500 font-semibold">Similarity: {(res.score * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed italic">
                      "{res.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Document Ingester UI Form */}
        <div>
          <form onSubmit={handleUpload} className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white text-base flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-orange-500" />
              Ingest Document Source
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Upload local files, repository paths, or folders. Our pipeline automatically parses text, chunks content, and generates vector index values.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">File Name or Path</label>
                <input
                  type="text"
                  placeholder="e.g. apps_handbook.pdf"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Parser Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'pdf', label: 'PDF Document' },
                    { type: 'docx', label: 'Word Doc' },
                    { type: 'txt', label: 'Plain Text' },
                    { type: 'markdown', label: 'Markdown' },
                    { type: 'csv', label: 'CSV Table' },
                    { type: 'git', label: 'Git Repository' }
                  ].map((btn) => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setDocType(btn.type)}
                      className={`text-xs p-2 rounded-lg font-medium transition-all border ${
                        docType === btn.type
                          ? 'bg-orange-600/15 text-orange-400 border-orange-500/40'
                          : 'bg-gray-950 hover:bg-gray-900 text-gray-400 border-gray-800'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-dashed border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-950/30">
                <Layers className="w-7 h-7 text-gray-500 mb-2 animate-pulse" />
                <span className="text-xs font-medium text-gray-300">File Auto chunker (512 overlap) enabled</span>
                <span className="text-[10px] text-gray-500 mt-1">Embeddings Engine: Ollama nomic-embed-text</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 rounded-lg text-sm transition-all shadow-md shadow-orange-950/20"
            >
              {uploading ? 'Processing Chunk pipeline...' : 'Compile & Embed Document'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default RAGKnowledge;