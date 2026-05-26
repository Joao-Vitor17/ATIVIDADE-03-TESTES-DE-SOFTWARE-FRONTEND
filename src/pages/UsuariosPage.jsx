import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as usuarioService from '../services/usuarioService';
import { 
  Plus, 
  User, 
  ShieldCheck, 
  Trash2, 
  Edit2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  AlertCircle,
  Mail,
  UserCircle
} from 'lucide-react';

export function UsuariosPage() {
  const { usuario: currentAccount } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);

  // Paginação
  const [pagina, setPagina] = useState(1);
  const porPagina = 5;

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const data = await usuarioService.listarUsuarios();
      setUsuarios(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (e) {
      setErro('Erro ao carregar lista de usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalPaginas = Math.ceil(usuarios.length / porPagina);
  const atual = usuarios.slice((pagina - 1) * porPagina, pagina * porPagina);

  const mudarPagina = (onde) => {
    if (onde === 'prox' && pagina < totalPaginas) setPagina(p => p + 1);
    if (onde === 'ant' && pagina > 1) setPagina(p => p - 1);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      nome: fd.get('nome'),
      email: fd.get('email'),
      tipo: fd.get('tipo'),
    };
    
    // Only add password if provided (for new users or changing password)
    const password = fd.get('senha');
    if (password) payload.senha = password;

    setErro('');
    setMsg('');
    setSalvando(true);
    try {
      if (editando) {
        await usuarioService.atualizarUsuario(editando.id, payload);
        setMsg('Usuário atualizado com sucesso.');
      } else {
        if (!password) throw new Error('A senha é obrigatória para novos usuários.');
        await usuarioService.criarUsuario(payload);
        setMsg('Usuário cadastrado com sucesso.');
      }
      setModalAberto(false);
      setEditando(null);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || err.message || 'Falha ao salvar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = (id, nome) => {
    if (id === currentAccount?.id) {
      setErro('Você não pode excluir sua própria conta.');
      return;
    }

    setConfirmacao({
      msg: `Deseja realmente remover o usuário "${nome}"?`,
      tipo: 'danger',
      icon: <Trash2 size={32} />,
      action: async () => {
        try {
          await usuarioService.deletarUsuario(id);
          setMsg('Usuário removido.');
          carregar();
        } catch {
          setErro('Erro ao excluir usuário.');
        } finally {
          setConfirmacao(null);
        }
      }
    });
  };

  const abrirModalEditar = (u) => {
    setEditando(u);
    setModalAberto(true);
  };

  return (
    <div className="stack">
      <div className="page-intro">
        <h2>Gestão de Usuários</h2>
        <p>Controle de acesso e membros da biblioteca</p>
      </div>

      {erro && (
        <div className="alert alert--error" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{erro}</span>
          <button onClick={() => setErro('')} className="btn-icon"><X size={16} /></button>
        </div>
      )}

      {msg && (
        <div className="alert alert--success" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CheckCircle size={18} />
          <span style={{ flex: 1 }}>{msg}</span>
          <button onClick={() => setMsg('')} className="btn-icon"><X size={16} /></button>
        </div>
      )}

      {loading && !usuarios.length ? (
        <p className="empty-hint">Sincronizando usuários...</p>
      ) : usuarios.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">Nenhum usuário encontrado no sistema.</p>
        </div>
      ) : (
        <>
          <div className="list-cards">
            {atual.map(u => (
              <div key={u.id} className="list-card">
                <div className="list-card__top">
                  <div className="list-card__header-text">
                    <h3 className="list-card__title">{u.nome}</h3>
                    <div className="list-card__meta">
                      <Mail size={14} style={{ marginRight: '4px' }} />
                      {u.email}
                    </div>
                  </div>
                  <span className={`badge ${u.tipo === 'admin' ? 'badge--admin' : 'badge--aluno'}`} style={{ flexShrink: 0 }}>
                    {u.tipo}
                  </span>
                </div>

                <div className="list-card__actions">
                  <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => abrirModalEditar(u)}>
                    <Edit2 size={16} /> Editar
                  </button>
                  <button className="btn btn--danger btn--sm" style={{ flex: 1 }} onClick={() => handleRemover(u.id, u.nome)}>
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="pagination">
              <button onClick={() => mudarPagina('ant')} disabled={pagina === 1} className="btn btn--secondary btn--sm">
                <ChevronLeft size={18} />
              </button>
              <span className="text-muted">Pág. {pagina} de {totalPaginas}</span>
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
              <h3 className="modal-title">{editando ? 'Editar Usuário' : 'Novo Cadastro'}</h3>
              <button className="modal-close" onClick={() => setModalAberto(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSalvar}>
              <div className="modal-body form-stack">
                <div className="form-field">
                  <label>Nome Completo</label>
                  <input name="nome" defaultValue={editando?.nome || ''} required />
                </div>
                <div className="form-field">
                  <label>E-mail (Login)</label>
                  <input type="email" name="email" defaultValue={editando?.email || ''} required />
                </div>
                <div className="form-field">
                  <label>Senha {editando && '(deixe em branco para manter)'}</label>
                  <input type="password" name="senha" placeholder="••••••••" required={!editando} />
                </div>
                <div className="form-field">
                  <label>Tipo de Perfil</label>
                  <select name="tipo" defaultValue={editando?.tipo || 'aluno'} required>
                    <option value="aluno">Aluno</option>
                    <option value="admin">Administrador</option>
                  </select>
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
          <div className="modal" style={{ maxWidth: '340px' }} onClick={e => e.stopPropagation()}>
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
                {confirmacao.icon}
              </div>
              <h3 style={{ margin: '0 0 0.5rem' }}>Confirmação</h3>
              <p className="text-muted" style={{ margin: 0 }}>{confirmacao.msg}</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', background: 'transparent' }}>
               <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setConfirmacao(null)}>Voltar</button>
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
