import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as emprestimoService from '../services/emprestimoService';
import * as livroService from '../services/livroService';
import * as usuarioService from '../services/usuarioService';
import { 
  Plus, 
  Handshake, 
  Book, 
  User, 
  Calendar, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';

export function EmprestimosPage() {
  const { isAdmin, usuario } = useAuth();
  const [lista, setLista] = useState([]);
  const [livros, setLivros] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null); // { id, tipo, msg, action }

  // Paginação
  const [pagina, setPagina] = useState(1);
  const porPagina = 5;

  const carregar = useCallback(async () => {
    setErro('');
    setLoading(true);
    try {
      const [e, l, u] = await Promise.all([
        emprestimoService.listarEmprestimos(),
        livroService.listarLivros(),
        usuarioService.listarUsuarios().catch(() => []) 
      ]);

      setLista(Array.isArray(e) ? e : (e ? [e] : []));
      setLivros(l);
      
      if (u.length === 0 && usuario) {
        setUsuarios([usuario]);
      } else {
        setUsuarios(u);
      }
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalPaginas = Math.ceil(lista.length / porPagina);
  const atual = lista.slice((pagina - 1) * porPagina, pagina * porPagina);

  const mudarPagina = (onde) => {
    if (onde === 'prox' && pagina < totalPaginas) setPagina(p => p + 1);
    if (onde === 'ant' && pagina > 1) setPagina(p => p - 1);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      livro_id: Number(fd.get('livro_id')),
      usuario_id: Number(fd.get('usuario_id')),
      data_devolucao_prevista: fd.get('data_devolucao_prevista'),
    };

    setErro('');
    setMsg('');
    setSalvando(true);
    try {
      if (editando) {
        await emprestimoService.atualizarEmprestimo(editando.id, payload);
        setMsg('Empréstimo atualizado com sucesso.');
      } else {
        await emprestimoService.criarEmprestimo(payload.livro_id, payload.usuario_id, payload.data_devolucao_prevista);
        setMsg('Empréstimo registrado com sucesso.');
      }
      setModalAberto(false);
      setEditando(null);
      await carregar();
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao salvar empréstimo.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = async (id) => {
    setConfirmacao({
      id,
      tipo: 'danger',
      msg: 'Deseja realmente excluir este empréstimo permanentemente?',
      action: async () => {
        try {
          await emprestimoService.deletarEmprestimo(id);
          setMsg('Empréstimo excluído.');
          carregar();
        } catch {
          setErro('Erro ao excluir.');
        } finally {
          setConfirmacao(null);
        }
      }
    });
  };

  const handleDevolucao = async (id) => {
    setConfirmacao({
      id,
      tipo: 'success',
      msg: 'Confirmar o recebimento deste livro agora?',
      action: async () => {
        try {
          await emprestimoService.registrarDevolucao(id);
          setMsg('Devolução concluída.');
          await carregar();
        } catch {
          setErro('Erro ao processar devolução.');
        } finally {
          setConfirmacao(null);
        }
      }
    });
  };

  const fmt = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const abrirModalEditar = (e) => {
    setEditando(e);
    setModalAberto(true);
  };

  const livrosEmprestados = new Set(
    lista
      .filter(e => !e.data_devolucao_real)
      .map(e => e.livro_id)
  );

  const livrosDisponiveis = livros.filter(
    l => !livrosEmprestados.has(l.id) || (editando && l.id === editando.livro_id)
  );

  return (
    <div className="stack">
      <div className="page-intro">
        <h2>Empréstimos</h2>
        <p>Gestão de retiradas e devoluções</p>
      </div>

      {erro && (
        <div className="alert alert--error" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{erro}</span>
          <button onClick={() => setErro('')} className="btn-icon">
            <X size={16} />
          </button>
        </div>
      )}

      {msg && (
        <div className="alert alert--success" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CheckCircle size={18} />
          <span style={{ flex: 1 }}>{msg}</span>
          <button onClick={() => setMsg('')} className="btn-icon">
            <X size={16} />
          </button>
        </div>
      )}

      {loading && !lista.length ? (
        <p className="empty-hint">Carregando...</p>
      ) : lista.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">Nenhum registro encontrado.</p>
        </div>
      ) : (
        <>
          <div className="list-cards">
            {atual.map(e => {
              const ativo = !e.data_devolucao_real; // Usando data_devolucao conforme backend
              return (
                <div key={e.id} className="list-card">
                  <div className="list-card__top">
                    <div>
                      <h3 className="list-card__title">
                        {e.Livro?.titulo ?? `Livro #${e.livro_id}`}
                      </h3>
                      <div className="list-card__meta">
                        <User size={14} style={{ marginRight: '4px' }} />
                        {e.Usuario?.nome ?? `Usuário #${e.usuario_id}`}
                      </div>
                    </div>
                    <span className={`badge ${ativo ? 'badge--ok' : 'badge--aluno'}`}>
                      {ativo ? 'Ativo' : 'Concluído'}
                    </span>
                  </div>

                  <div className="list-card__row">
                    <div>
                      <span className="text-muted small">Prazo</span>
                      <p style={{ fontWeight: '600', color: ativo ? 'var(--brand)' : 'inherit' }}>
                        {fmt(e.data_devolucao_prevista)}
                      </p>
                    </div>
                  </div>

                  <div className="list-card__actions">
                    {ativo ? (
                      <>
                        <button className="btn btn--success btn--sm btn--block" onClick={() => handleDevolucao(e.id)}>
                          Devolver
                        </button>
                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                          <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => abrirModalEditar(e)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn--danger btn--sm" style={{ flex: 1 }} onClick={() => handleRemover(e.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <button className="btn btn--danger btn--sm btn--block" onClick={() => handleRemover(e.id)}>
                        <Trash2 size={16} /> Excluir Histórico
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="pagination">
              <button onClick={() => mudarPagina('ant')} disabled={pagina === 1} className="btn btn--secondary btn--sm">
                <ChevronLeft size={18} />
              </button>
              <span className="text-muted">Pág. {pagina} / {totalPaginas}</span>
              <button onClick={() => mudarPagina('prox')} disabled={pagina === totalPaginas} className="btn btn--secondary btn--sm">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      <button onClick={() => { setEditando(null); setModalAberto(true); }} className="fab">
        <Plus size={28} />
      </button>

      {modalAberto && (
        <div className="overlay" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editando ? 'Editar Empréstimo' : 'Novo Empréstimo'}</h3>
              <button className="modal-close" onClick={() => setModalAberto(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSalvar}>
              <div className="modal-body form-stack">
                <div className="form-field">
                  <label>Livro</label>
                  <select name="livro_id" defaultValue={editando?.livro_id || ''} required>
                    <option value="">Selecione um livro</option>
                    {livrosDisponiveis.map(l => (
                      <option key={l.id} value={l.id}>{l.titulo}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Usuário</label>
                  <select name="usuario_id" defaultValue={editando?.usuario_id || ''} required>
                    <option value="">Selecione o aluno</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Data de Devolução Prevista</label>
                  <input 
                    type="date" 
                    name="data_devolucao_prevista" 
                    defaultValue={editando?.data_devolucao_prevista?.split('T')[0] || ''} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmacao && (
        <div className="overlay" onClick={() => setConfirmacao(null)}>
          <div className="modal" style={{ maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '32px', 
                background: confirmacao.tipo === 'danger' ? 'var(--danger-soft)' : 'var(--success-soft)',
                color: confirmacao.tipo === 'danger' ? 'var(--danger)' : 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                {confirmacao.tipo === 'danger' ? <Trash2 size={32} /> : <Book size={32} />}
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>Você tem certeza?</h3>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.95rem' }}>{confirmacao.msg}</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', padding: '0 1.5rem 1.5rem', background: 'transparent' }}>
              <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setConfirmacao(null)}>
                Voltar
              </button>
              <button 
                className={`btn btn--${confirmacao.tipo}`} 
                style={{ flex: 1 }}
                onClick={confirmacao.action}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
