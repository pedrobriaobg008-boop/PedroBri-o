import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { createServer } from 'http';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Caminho correto das views e public
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import Cliente from '../models/Cliente.js';
import Maquina from '../models/Maquina.js';
import Jogo from '../models/Jogo.js';
import Sessao from '../models/Sessao.js';

// Servir arquivos estáticos
//app.use(express.static(join(__dirname, '../public')));
app.set('views', join(__dirname, '../views'));

// Rotas
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/', (req, res) => {
    res.render("index")
})

app.get('/cliente/lst', async (req, res) => {
    const q = req.query.q || "";
    const isNumber = !isNaN(q);

    const query = {
        $or: [
            { nome: { $regex: q, $options: "i" } },
            { cpf: { $regex: q, $options: "i" } },
            { telefone: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { jogo_favorito: { $regex: q, $options: "i" } },
            { plano_assinatura: { $regex: q, $options: "i" } },
        ]
    };

    if (isNumber && q.trim() !== "") {
        query.$or.push({ pontos: Number(q) });
    }

    if (isNumber && q.trim() !== "") {
        query.$or.push({ horas_jogadas: Number(q) });
    }

    const cliente = await Cliente.find(query);
    res.render("cliente/lst", { cliente, q });
});

app.get('/cliente/add', (req, res) => {
    res.render("cliente/add")
})

app.post('/cliente/add/ok', async (req, res) => {
    await Cliente.create({
        nome: req.body.nome,
        cpf: req.body.cpf,
        telefone: req.body.telefone,
        email: req.body.email,
        horas_jogadas: req.body.horas_jogadas,
        pontos: req.body.pontos,
        jogo_favorito: req.body.jogo_favorito,
        plano_assinatura: req.body.plano_assinatura
    });
    res.render("cliente/addok")
})

app.get('/cliente/edt/:id', async (req, res) => {
    const clienteDoc = await Cliente.findById(req.params.id);
    const cliente = clienteDoc.toObject({ getters: true });
    res.render("cliente/edt", {cliente})
})

app.post('/cliente/edt/:id', async (req, res) => {
    const updateData = {
        nome: req.body.nome,
        cpf: req.body.cpf,
        telefone: req.body.telefone,
        email: req.body.email,
        horas_jogadas: req.body.horas_jogadas,
        pontos: req.body.pontos,
        jogo_favorito: req.body.jogo_favorito,
        plano_assinatura: req.body.plano_assinatura
    };

    await Cliente.findByIdAndUpdate(req.params.id, updateData);
    res.render("cliente/edtok")
})

app.get('/cliente/del/:id', async (req, res) => {
    await Cliente.findByIdAndDelete(req.params.id)
    res.redirect("/cliente/lst")
})

app.get('/maquina/lst', async (req, res) => {
   const q = req.query.q || "";
   const isNumber = !isNaN(q);

    const query = {
        $or: [
            { nome_arcade: { $regex: q, $options: "i" } },
            { condicao: { $regex: q, $options: "i" } },
            { disponibilidade: { $regex: q, $options: "i" } },
            { conexao_internet: { $regex: q, $options: "i" } },
        ]
    };

    if (isNumber && q.trim() !== "") {
        query.$or.push({ jogos_instalados: Number(q) });
    }

    const maquinas = await Maquina.find(query);
    res.render("maquina/lst", { maquinas, q });
});

app.get('/maquina/add', (req, res) => {
    res.render("maquina/add")
})

app.post('/maquina/add/ok', async (req, res) => {
    await Maquina.create({
        nome_arcade: req.body.nome_arcade,
        jogos_instalados: req.body.jogos_instalados,
        condicao: req.body.condicao,
        disponibilidade: req.body.disponibilidade,
        conexao_internet: req.body.conexao_internet,
    });
    res.render("maquina/addok")
})

app.get('/maquina/edt/:id', async (req, res) => {
    try {
        const doc = await Maquina.findById(req.params.id);
        if (!doc) {
            return res.status(404).send('Maquina não encontrada');
        }
  // aplicar getters para gerar data URI da foto (se houver)
  const maquinaObj = doc.toObject({ getters: true });
        
        if (maquinaObj.data_aquisicao) {
            const dt = new Date(maquinaObj.data_aquisicao);
            function pad(n) { return n < 10 ? '0' + n : n; }
            maquinaObj.data_iso = dt.getUTCFullYear() + '-' + 
                                 pad(dt.getUTCMonth() + 1) + '-' + 
                                 pad(dt.getUTCDate());
        } else {
            maquinaObj.data_iso = '';
        }
        
        res.render("maquina/edt", {maquina: maquinaObj});
    } catch (err) {
        console.error('Erro ao editar maquina:', err);
        res.status(500).send('Erro ao buscar maquina para edição');
    }
});

app.post('/maquina/edt/:id', upload.single('foto'), async (req, res) => {
        const updateData = {
            nome_arcade: req.body.nome_arcade,
            jogos_instalados: req.body.jogos_instalados,
            condicao: req.body.condicao,
            disponibilidade: req.body.disponibilidade,
            conexao_internet: req.body.conexao_internet,
        };
        await Maquina.findByIdAndUpdate(req.params.id, updateData);
        res.render("maquina/edtok");
});

app.get('/maquina/del/:id', async (req, res) => {
    await Maquina.findByIdAndDelete(req.params.id)
    res.redirect("/maquina/lst")
})

app.get('/jogo/lst', async (req, res) => {
  const q = req.query.q || "";
    const isNumber = !isNaN(q);

    const query = {
        $or: [
            { titulo: { $regex: q, $options: "i" } },
            { genero: { $regex: q, $options: "i" } },
            { classificacao_etaria: { $regex: q, $options: "i" } },
            { plataforma: { $regex: q, $options: "i" } },
        ]
    };

    if (isNumber && q.trim() !== "") {
        query.$or.push({ popularidade: Number(q) });
    }

    if (isNumber && q.trim() !== "") {
        query.$or.push({ qtd_jogadores: Number(q) });
    }

    if (isNumber && q.trim() !== "") {
        query.$or.push({ recorde: Number(q) });
    }

    const jogoDocs = await Jogo.find(query);
    const jogo = jogoDocs.map(doc => doc.toObject({ getters: true }));
    res.render("jogo/lst", { jogo, q });
});

app.get('/jogo/add', async (req, res) => {
    res.render('jogo/add');
});

app.post('/jogo/add/ok', upload.single('foto'), async (req, res) => {
    await Jogo.create({
        titulo: req.body.titulo,
        genero: req.body.genero,
        popularidade: req.body.popularidade,
        qtde_jogadores: req.body.qtde_jogadores,
        recorde: req.body.recorde,
        foto: req.file.buffer
    });
    res.render("jogo/addok");
})

app.get('/jogo/edt/:id', async (req, res) => {
  const jogoDoc = await Jogo.findById(req.params.id);
  const jogo = jogoDoc.toObject({ getters: true });
  res.render("jogo/edt", {jogo});
});

app.post('/jogo/edt/:id', upload.single('foto'), async (req, res) => {
    const updateData = {
            titulo: req.body.titulo,
            genero: req.body.genero,
            popularidade: req.body.popularidade,
            qtde_jogadores: req.body.qtde_jogadores,
            recorde: req.body.recorde,
            foto: req.file ? req.file.buffer : undefined
    };
    await Jogo.findByIdAndUpdate(req.params.id, updateData);
    res.render("jogo/edtok")
})

app.get('/jogo/del/:id', async (req, res) => {
    await Jogo.findByIdAndDelete(req.params.id)
    res.redirect("/jogo/lst")
})

app.get('/sessao/lst', async (req, res) => {
  try {
    const q = req.query.q || "";
    let query = {};

    if (q.trim() !== "") {
      const isNumber = !isNaN(q);
      
      // Tenta buscar por valor_total se for número
      if (isNumber) {
        query.valor_total = Number(q);
      } else {
        // Tenta parse de data em formato brasileiro dd/mm/yyyy
        const dateMatch = q.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (dateMatch) {
          const day = Number(dateMatch[1]);
          const month = Number(dateMatch[2]) - 1;
          const year = Number(dateMatch[3]);
          const start = new Date(year, month, day, 0, 0, 0, 0);
          const end = new Date(year, month, day, 23, 59, 59, 999);
          query.$or = [
            { hora_ini: { $gte: start, $lte: end } },
            { hora_fim: { $gte: start, $lte: end } }
          ];
        }
      }
    }

    const sessoes = await Sessao.find(query)
      .populate('id_cliente', 'nome')
      .populate('id_maquina', 'nome_arcade')
      .populate('id_jogo', 'titulo')
      .lean();

    // Formatar as datas para exibição
    const sessao = sessoes.map(s => {
      const obj = { ...s };
      if (obj.hora_ini) {
        obj.hora_ini_formatada = new Date(obj.hora_ini).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      }
      if (obj.hora_fim) {
        obj.hora_fim_formatada = new Date(obj.hora_fim).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      }
      // Calcular duração em minutos
      if (obj.hora_ini && obj.hora_fim) {
        const diff = new Date(obj.hora_fim) - new Date(obj.hora_ini);
        obj.duracao_minutos = Math.round(diff / 60000);
      }
      return obj;
    });

    res.render('sessao/lst', { sessao, q });
  } catch (err) {
    console.error('Erro em /sessao/lst:', err);
    res.render('sessao/lst', { sessao: [], q: '' });
  }
});

app.get('/sessao/add', async (req, res) => {
  try {
    const clientes = await Cliente.find().lean();
    const maquinas = await Maquina.find().lean();
    const jogos = await Jogo.find().lean();
    res.render("sessao/add", { clientes, maquinas, jogos });
  } catch (err) {
    console.error('Erro ao carregar formulário:', err);
    res.render("sessao/add", { clientes: [], maquinas: [], jogos: [] });
  }
});

app.post('/sessao/add/ok', async (req, res) => {
  try {
    await Sessao.create({
      id_cliente: req.body.id_cliente,
      id_maquina: req.body.id_maquina,
      id_jogo: req.body.id_jogo,
      hora_ini: new Date(req.body.hora_ini),
      hora_fim: new Date(req.body.hora_fim),
      valor_total: req.body.valor_total
    });
    res.render("sessao/addok");
  } catch (err) {
    console.error('Erro ao criar sessão:', err);
    res.status(500).send('Erro ao criar sessão');
  }
});

app.get('/sessao/edt/:id', async (req, res) => {
  try {
    const doc = await Sessao.findById(req.params.id);
    if (!doc) return res.status(404).send('Sessão não encontrada');
    
    const sessao = doc.toObject();
    
    // Formatar datas para input datetime-local
    if (sessao.hora_ini) {
      sessao.hora_ini_input = new Date(sessao.hora_ini)
        .toLocaleString('sv', { timeZone: 'America/Sao_Paulo' })
        .slice(0, 16);
    }
    if (sessao.hora_fim) {
      sessao.hora_fim_input = new Date(sessao.hora_fim)
        .toLocaleString('sv', { timeZone: 'America/Sao_Paulo' })
        .slice(0, 16);
    }
    
    // Carregar listas para os selects
    const clientes = await Cliente.find().lean();
    const maquinas = await Maquina.find().lean();
    const jogos = await Jogo.find().lean();
    
    res.render("sessao/edt", { sessao, clientes, maquinas, jogos });
  } catch (err) {
    console.error('Erro ao editar sessão:', err);
    res.status(500).send('Erro ao buscar sessão');
  }
});

app.post('/sessao/edt/:id', async (req, res) => {
  try {
    await Sessao.findByIdAndUpdate(req.params.id, {
      id_cliente: req.body.id_cliente,
      id_maquina: req.body.id_maquina,
      id_jogo: req.body.id_jogo,
      hora_ini: new Date(req.body.hora_ini),
      hora_fim: new Date(req.body.hora_fim),
      valor_total: req.body.valor_total
    });
    res.render("sessao/edtok");
  } catch (err) {
    console.error('Erro ao salvar sessão:', err);
    res.status(500).send('Erro ao salvar alterações');
  }
});

app.get('/sessao/del/:id', async (req, res) => {
  await Sessao.findByIdAndDelete(req.params.id);
  res.redirect("/sessao/lst");
});

//=============== S I T E ================

app.get('/site', async (req, res) => {
  try {
    // Carregar dados do banco de dados
    const clientes = await Cliente.find().limit(4).lean();
    const maquinas = await Maquina.find().lean();
    const jogos = await Jogo.find().lean();
    const sessoes = await Sessao.find()
      .populate('id_cliente', 'nome')
      .populate('id_maquina', 'nome_arcade')
      .populate('id_jogo', 'titulo')
      .lean()
      .limit(6); // Mostrar últimas 6 sessões

    // Calcular estatísticas
    const totalClientes = await Cliente.countDocuments();
    const totalMaquinas = await Maquina.countDocuments();
    const totalJogos = await Jogo.countDocuments();
    const totalSessoes = await Sessao.countDocuments();

    // Calcular horas jogadas totais
    let horasJogadasTotal = 0;
    sessoes.forEach(s => {
      if (s.hora_ini && s.hora_fim) {
        const diff = new Date(s.hora_fim) - new Date(s.hora_ini);
        horasJogadasTotal += diff / (1000 * 60 * 60); // converter para horas
      }
    });

    // Calcular sessões ativas (em andamento agora)
    const agora = new Date();
    const sessoesAtivas = sessoes.filter(s => {
      const ini = new Date(s.hora_ini);
      const fim = new Date(s.hora_fim);
      return ini <= agora && agora <= fim;
    }).length;

    // Calcular receita de hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const sessoeHoje = await Sessao.find({
      hora_ini: { $gte: hoje, $lt: amanha }
    }).lean();

    const receitaHoje = sessoeHoje.reduce((total, s) => total + (s.valor_total || 0), 0);

    // Mapear dados de clientes com status (VIP ou Regular)
    // Mapear dados de clientes com status (VIP ou Regular)
const clientesMapeados = clientes.map(c => {
  let status = 'regular';
  const plano = (c.plano_assinatura || 'Regular').toLowerCase();
  
  if (plano.includes('platinum')) status = 'vip-platinum';
  else if (plano.includes('gold')) status = 'vip-gold';
  else status = 'regular';
  
  return {
    ...c,
    status: status,
    plano: c.plano_assinatura || 'Regular'
  };
});

    // Mapear dados de máquinas com lógica corrigida de status
    const maquinasMapeadas = maquinas.map(m => {
      let statusDisponibilidade = 'disponivel';
      let iconStatus = '📶';
      
      // Status baseado em disponibilidade
      if (m.disponibilidade === 'Em Manutenção') {
        statusDisponibilidade = 'manutencao';
      } else if (m.disponibilidade === 'Em Uso') {
        statusDisponibilidade = 'em-uso';
      }
      
      // Status de conexão
      const statusConexao = m.conexao_internet === 'Sim' ? 'Online' : 'Offline';
      
      return {
        ...m,
        statusDisponibilidade: statusDisponibilidade,
        statusConexao: statusConexao,
        condicao: m.condicao || 'Ótima'
      };
    });

    // Mapear dados de jogos com cores de gradiente
    const cores = [
      { bg: '#ef4444', text: '#f97316' }, // vermelho-laranja
      { bg: '#eab308', text: '#fb923c' }, // amarelo-laranja
      { bg: '#a855f7', text: '#ec4899' }, // roxo-rosa
      { bg: '#22c55e', text: '#059669' }, // verde
      { bg: '#f97316', text: '#ef4444' }, // laranja-vermelho
      { bg: '#3b82f6', text: '#06b6d4' }, // azul-ciano
      { bg: '#6366f1', text: '#a855f7' }, // indigo-roxo
      { bg: '#06b6d4', text: '#2563eb' }  // ciano-azul
    ];

    const jogosMapeados = jogos.map((j, idx) => {
      const cor = cores[idx % cores.length];
      return {
        ...j,
        cor: cor,
        porcentagemPopularidade: Math.min(j.popularidade || 50, 100)
      };
    });

    // Mapear dados de sessões para o site
    const sessoesMapeadas = sessoes.map(s => {
      const ini = new Date(s.hora_ini);
      const fim = new Date(s.hora_fim);
      const diff = fim - ini;
      const duracao = Math.round(diff / (1000 * 60)); // minutos
      const horas = Math.floor(duracao / 60);
      const minutos = duracao % 60;

      const agora = new Date();
      const ativa = ini <= agora && agora <= fim;

      return {
        ...s,
        cliente_nome: s.id_cliente?.nome || 'N/A',
        maquina_nome: s.id_maquina?.nome_arcade || 'N/A',
        jogo_nome: s.id_jogo?.titulo || 'N/A',
        duracao_formatada: `${horas}h ${minutos}min`,
        duracao_minutos: duracao,
        data_formatada: ini.toLocaleDateString('pt-BR'),
        hora_formatada: ini.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        ativa: ativa
      };
    });

    res.render("site/index", {
      clientes: clientesMapeados,
      maquinas: maquinasMapeadas,
      jogos: jogosMapeados,
      sessoes: sessoesMapeadas,
      stats: {
        totalClientes,
        totalMaquinas,
        totalJogos,
        totalSessoes,
        horasJogadasTotal: Math.round(horasJogadasTotal),
        sessoesAtivas,
        receitaHoje
      }
    });
  } catch (err) {
    console.error('Erro ao carregar site:', err);
    res.render("site/index", {
      clientes: [],
      maquinas: [],
      jogos: [],
      sessoes: [],
      stats: {
        totalClientes: 0,
        totalMaquinas: 0,
        totalJogos: 0,
        totalSessoes: 0,
        horasJogadasTotal: 0,
        sessoesAtivas: 0,
        receitaHoje: 0
      }
    });
  }
});
app.listen(3001)
// Exporta o handler compatível com Vercel
export default app;