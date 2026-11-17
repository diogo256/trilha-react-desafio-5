import { useState, useMemo, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { api } from '../../services/api';
import { getPosts, Post } from '../../utils/mdx-utils';
import { getGlobalData, GlobalData } from '../../utils/global-data';
import Layout, { GradientBackground } from '../../components/Layout';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import MyButton from '../../components/form/Button';

interface ExportPageProps {
  initialPosts: Post[];
  globalData: GlobalData;
}

export default function ExportPage({ initialPosts, globalData }: ExportPageProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'raw'>('table');

  // Detect all available column keys from data
  const availableColumns = useMemo(() => {
    const keys = new Set<string>();
    posts.forEach((post) => {
      Object.keys(post).forEach((key) => keys.add(key));
    });
    // Ensure default order if present
    const preferredOrder = ['id', 'title', 'name', 'description', 'created_at', 'body'];
    const ordered: string[] = [];
    preferredOrder.forEach((k) => {
      if (keys.has(k)) {
        ordered.push(k);
        keys.delete(k);
      }
    });
    return [...ordered, ...Array.from(keys)];
  }, [posts]);

  // Selected fields for export (initialized with all available columns)
  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    const keys = new Set<string>();
    (initialPosts || []).forEach((post) => {
      Object.keys(post).forEach((key) => keys.add(key));
    });
    const preferredOrder = ['id', 'title', 'name', 'description', 'created_at', 'body'];
    const ordered: string[] = [];
    preferredOrder.forEach((k) => {
      if (keys.has(k)) {
        ordered.push(k);
        keys.delete(k);
      }
    });
    return [...ordered, ...Array.from(keys)];
  });

  // Keep in sync if columns update
  useEffect(() => {
    if (availableColumns.length > 0 && selectedFields.length === 0) {
      setSelectedFields(availableColumns);
    }
  }, [availableColumns, selectedFields.length]);

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const selectAllFields = () => setSelectedFields(availableColumns);
  const deselectAllFields = () => setSelectedFields([]);

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) return posts;
    const term = searchTerm.toLowerCase();
    return posts.filter((p) => {
      return (
        String(p.title || '').toLowerCase().includes(term) ||
        String(p.name || '').toLowerCase().includes(term) ||
        String(p.description || '').toLowerCase().includes(term) ||
        String(p.id || '').toLowerCase().includes(term) ||
        String(p.body || '').toLowerCase().includes(term)
      );
    });
  }, [posts, searchTerm]);

  // Data mapped with only selected fields
  const exportableData = useMemo(() => {
    const fields = selectedFields.length > 0 ? selectedFields : availableColumns;
    return filteredPosts.map((post) => {
      const filtered: Record<string, any> = {};
      fields.forEach((field) => {
        filtered[field] = (post as any)[field];
      });
      return filtered;
    });
  }, [filteredPosts, selectedFields, availableColumns]);

  // Stats
  const totalPosts = posts.length;
  const uniqueAuthors = useMemo(() => {
    const authors = new Set(posts.map((p) => p.name).filter(Boolean));
    return authors.size;
  }, [posts]);

  const rawJsonString = useMemo(() => {
    return JSON.stringify(exportableData, null, 2);
  }, [exportableData]);

  const estimatedSizeKb = useMemo(() => {
    return (new Blob([rawJsonString]).size / 1024).toFixed(1);
  }, [rawJsonString]);

  // Refresh live from Supabase
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<Post[]>('/posts');
      if (data) {
        setPosts(data);
      }
    } catch (err) {
      console.error('Erro ao atualizar dados do Supabase:', err);
      alert('Erro ao buscar dados atualizados do Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper download trigger
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as JSON
  const handleExportJSON = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob([rawJsonString], { type: 'application/json;charset=utf-8;' });
    triggerDownload(blob, `supabase_posts_${dateStr}.json`);
  };

  // Export as CSV
  const handleExportCSV = () => {
    if (exportableData.length === 0) return;
    const fields = selectedFields.length > 0 ? selectedFields : availableColumns;
    const headerRow = fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(',');

    const rows = exportableData.map((item) =>
      fields
        .map((field) => {
          const val = item[field];
          if (val === null || val === undefined) return '""';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    // \uFEFF BOM ensures Microsoft Excel recognizes UTF-8 accented characters
    const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(blob, `supabase_posts_${dateStr}.csv`);
  };

  // Export as Markdown backup
  const handleExportMarkdown = () => {
    if (filteredPosts.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);

    const mdContent = filteredPosts
      .map((post, idx) => {
        const frontmatter = [
          '---',
          `id: "${post.id || ''}"`,
          `title: "${(post.title || '').replace(/"/g, '\\"')}"`,
          `author: "${(post.name || '').replace(/"/g, '\\"')}"`,
          `created_at: "${post.created_at || ''}"`,
          `description: "${(post.description || '').replace(/"/g, '\\"')}"`,
          '---',
        ].join('\n');

        return `${frontmatter}\n\n# ${post.title || `Post ${idx + 1}`}\n\n${post.body || ''}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    triggerDownload(blob, `supabase_posts_backup_${dateStr}.md`);
  };

  // Copy to clipboard
  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(rawJsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar:', err);
      alert('Não foi possível copiar automaticamente para a área de transferência.');
    }
  };

  return (
    <Layout maxWidth="max-w-5xl">
      <SEO
        title={`Exportar Dados - ${globalData.name}`}
        description="Página de exportação e backup de todo o conteúdo armazenado no Supabase"
      />
      <Header name={globalData.name} />

      <main className="w-full px-4 sm:px-6 md:px-0">
        {/* Navigation & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link href="/">
            <a className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition">
              <span className="mr-1.5">←</span> Voltar para o Blog
            </a>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/insertPost">
              <a className="inline-flex items-center text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 transition">
                + Novo Post
              </a>
            </Link>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Recarregar dados do Supabase"
              className="inline-flex items-center text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 transition disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isLoading ? 'Atualizando...' : 'Recarregar'}
            </button>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
            Exportar Conteúdo Supabase
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
            Faça download, cópia ou backup completo de todos os registros da tabela{' '}
            <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 font-mono text-primary text-xs md:text-sm">
              public.posts
            </code>{' '}
            em múltiplos formatos (JSON, CSV e Markdown).
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl backdrop-blur-lg bg-white/40 dark:bg-black/30 border border-gray-200 dark:border-gray-800 text-center shadow-sm">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              Total de Posts
            </span>
            <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {totalPosts}
            </p>
          </div>

          <div className="p-4 rounded-xl backdrop-blur-lg bg-white/40 dark:bg-black/30 border border-gray-200 dark:border-gray-800 text-center shadow-sm">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              Autores Únicos
            </span>
            <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {uniqueAuthors}
            </p>
          </div>

          <div className="p-4 rounded-xl backdrop-blur-lg bg-white/40 dark:bg-black/30 border border-gray-200 dark:border-gray-800 text-center shadow-sm">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              Itens Filtrados
            </span>
            <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {filteredPosts.length}
            </p>
          </div>

          <div className="p-4 rounded-xl backdrop-blur-lg bg-white/40 dark:bg-black/30 border border-gray-200 dark:border-gray-800 text-center shadow-sm">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              Tamanho Est.
            </span>
            <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {estimatedSizeKb} <span className="text-sm font-normal text-gray-500">KB</span>
            </p>
          </div>
        </div>

        {/* Export Action Card */}
        <section className="mb-8 p-6 md:p-8 rounded-xl backdrop-blur-lg bg-white/40 dark:bg-black/30 border border-gray-200 dark:border-gray-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Formatos de Exportação
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Escolha o formato desejado para salvar os dados em sua máquina.
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportJSON}
                disabled={exportableData.length === 0}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar JSON
              </button>

              <button
                onClick={handleExportCSV}
                disabled={exportableData.length === 0}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm active:scale-95 transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar CSV (Excel)
              </button>

              <button
                onClick={handleExportMarkdown}
                disabled={exportableData.length === 0}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm active:scale-95 transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Backup Markdown (.md)
              </button>

              <button
                onClick={handleCopyJSON}
                disabled={exportableData.length === 0}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Copiado!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copiar JSON
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Fields Selection Filter */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-600 dark:text-gray-300">
                Campos / Colunas a incluir ({selectedFields.length} de {availableColumns.length} selecionados):
              </span>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={selectAllFields}
                  className="text-primary hover:underline font-medium"
                >
                  Selecionar todos
                </button>
                <span className="text-gray-400">•</span>
                <button
                  type="button"
                  onClick={deselectAllFields}
                  className="text-gray-500 dark:text-gray-400 hover:underline font-medium"
                >
                  Desmarcar todos
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableColumns.map((col) => {
                const isChecked = selectedFields.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleField(col)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition border ${
                      isChecked
                        ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20'
                        : 'bg-gray-100 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    {isChecked ? '✓ ' : '+ '}
                    {col}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Data Preview Section */}
        <section className="mb-12 p-6 md:p-8 rounded-xl backdrop-blur-lg bg-white/40 dark:bg-black/30 border border-gray-200 dark:border-gray-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Filtrar por título, autor, id ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-9 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-black/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* View Tabs */}
            <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('table')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'table'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Visualização Tabela
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'raw'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                JSON Bruto
              </button>
            </div>
          </div>

          {/* Active Tab Content */}
          {activeTab === 'table' ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-3">Título</th>
                    <th className="p-3">Autor</th>
                    <th className="p-3">Criado em</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => (
                      <tr
                        key={post.id}
                        className="hover:bg-white/50 dark:hover:bg-gray-800/40 transition"
                      >
                        <td className="p-3 font-semibold text-gray-900 dark:text-white max-w-xs truncate">
                          {post.title || <span className="italic text-gray-400">Sem título</span>}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {post.name || '-'}
                        </td>
                        <td className="p-3 text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono text-xs">
                          {post.created_at
                            ? new Date(post.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 max-w-sm truncate">
                          {post.description || '-'}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <Link href={`/posts/${post.id}`}>
                            <a
                              target="_blank"
                              className="text-primary hover:underline text-xs font-semibold"
                            >
                              Ver Post ↗
                            </a>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 rounded-lg bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto max-h-96 border border-gray-800">
                {rawJsonString}
              </pre>
            </div>
          )}
        </section>
      </main>

      <Footer copyrightText={globalData.footerText} />
      <GradientBackground
        variant="large"
        className="fixed top-20 opacity-40 dark:opacity-60"
      />
      <GradientBackground
        variant="small"
        className="absolute bottom-0 opacity-20 dark:opacity-10"
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<ExportPageProps> = async () => {
  const globalData = getGlobalData();
  const initialPosts = await getPosts();

  return {
    props: {
      globalData,
      initialPosts,
    },
  };
};
