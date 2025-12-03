import { createServer } from 'http';

import express from 'express'
const app = express();

import Cliente from '../models/Cliente.js';
import Maquina from '../models/Maquina.js';
import Jogo from '../models/Jogo.js';
import Sessao from '../models/Sessao.js';

app.use(express.urlencoded({extended:true}))
app.set('view engine', 'ejs')

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(__dirname + '../public'))

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

// ...existing code...
app.get('/maquina/lst', async (req, res) => {
  const qRaw = req.query.q || "";
  const q = qRaw.trim();

  const textOr = [
    { nome: { $regex: q, $options: "i" } },
    { fabricante: { $regex: q, $options: "i" } },
    { status: { $regex: q, $options: "i" } }
  ];

  let query = {};
  if (q !== "") {
    const rangeMatch = q.match(/^(\d+[.,]?\d*)\s*-\s*(\d+[.,]?\d*)$/);
    if (rangeMatch) {
      const a = parseFloat(rangeMatch[1].replace(',', '.'));
      const b = parseFloat(rangeMatch[2].replace(',', '.'));
      if (!isNaN(a) && !isNaN(b)) {
        textOr.push({ preco_hora: { $gte: Math.min(a, b), $lte: Math.max(a, b) } });
      }
    } else {
      const num = parseFloat(q.replace(',', '.'));
      if (!isNaN(num)) {
        textOr.push({ preco_hora: num });
      }
    }
    query = { $or: textOr };
  }

  const docs = await Maquina.find(query);
  function pad(n) { return n < 10 ? '0' + n : n; }
  const maquinas = docs.map(d => {
    // aplicar getters para que foto (Buffer) seja convertida em data URI
    const obj = d.toObject({ getters: true });
    if (obj.data_aquisicao) {
      const dt = new Date(obj.data_aquisicao);
      obj.data_iso = dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
      obj.data_display = pad(dt.getUTCDate()) + '/' + pad(dt.getUTCMonth() + 1) + '/' + dt.getUTCFullYear();
    } else {
      obj.data_iso = '';
      obj.data_display = '';
    }
    return obj;
  });

  res.render("maquina/lst", { maquinas, q: qRaw });
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
    try {
        if (req.body.data_aquisicao) {
            req.body.data_aquisicao = new Date(req.body.data_aquisicao + 'T12:00:00Z');
        }
        const updateData = {
            nome: req.body.nome,
            fabricante: req.body.fabricante,
            status: req.body.status,
            preco_hora: req.body.preco_hora,
            data_aquisicao: req.body.data_aquisicao
        };
        // Só atualiza foto se foi enviada
        if (req.file) {
            updateData.foto = req.file.buffer;
        }
        await Maquina.findByIdAndUpdate(req.params.id, updateData);
        res.render("maquina/edtok");
    } catch (err) {
        console.error('Erro ao salvar maquina:', err);
        res.status(500).send('Erro ao salvar alterações da maquina');
    }
});

app.get('/maquina/del/:id', async (req, res) => {
    await Maquina.findByIdAndDelete(req.params.id)
    res.redirect("/maquina/lst")
})

app.get('/jogo/lst', async (req, res) => {
  const q = (req.query.q || '').trim();
  let query = {};
  if (q !== '') {
    const regex = { $regex: q, $options: 'i' };
    const campos = ['titulo', 'genero', 'classificacao_etaria', 'plataforma'];
    query = { $or: campos.map(c => ({ [c]: regex })) };
  }
  const jogos = await Jogo.find(query);
  res.render('jogo/lst', { jogo: jogos, q });
});

app.get('/jogo/add', async (req, res) => {
  try {
    const docs = await Console.find().lean();
    const plataformas = Array.from(new Set(docs.map(d => d.nome).filter(p => !!p)));
    res.render('jogo/add', { plataformas });
  } catch (err) {
    console.error('Erro em /jogo/add:', err);
    res.render('jogo/add', { plataformas: [] });
  }
});

app.post('/jogo/add/ok', upload.single('foto'), async (req, res) => {
    await Jogo.create({
        titulo: req.body.titulo,
        genero: req.body.genero,
        classificacao_etaria: req.body.classificacao_etaria,
        plataforma: req.body.plataforma,
        foto: req.file.buffer
    });
    res.render("jogo/addok" )
})

app.get('/jogo/edt/:id', async (req, res) => {
  try {
    const doc = await Jogo.findById(req.params.id).lean();
    if (!doc) return res.status(404).send('Jogo não encontrado');
    const docs = await Console.find().lean();
    const plataformas = Array.from(new Set(docs.map(d => d.nome).filter(p => !!p)));
    if (doc.plataforma && !plataformas.includes(doc.plataforma)) plataformas.unshift(doc.plataforma);
    res.render('jogo/edt', { jogo: doc, plataformas });
  } 
    catch (err) {
    console.error('Erro em /jogo/edt/:id', err);
    res.status(500).send('Erro ao buscar jogo');
  }
});

app.post('/jogo/edt/:id', async (req, res) => {
    await Jogo.findByIdAndUpdate(req.params.id, req.body)
    res.render("jogo/edtok")
})

app.get('/jogo/del/:id', async (req, res) => {
    await Jogo.findByIdAndDelete(req.params.id)
    res.redirect("/jogo/lst")
})

// ...existing code...
app.get('/sessao/lst', async (req, res) => {
  try {
    const qRaw = (req.query.q || '').trim();
    let docs = [];

    if (qRaw === '') {
      // sem pesquisa -> lista tudo
      docs = await Sessao.find().lean();
    } else {
      const or = [];

      // 1) dd/mm/yyyy ou dd/mm/yyyy hh:mm
      const dm = qRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
      if (dm) {
        const day = Number(dm[1]), month = Number(dm[2]) - 1, year = Number(dm[3]);
        if (dm[4] && dm[5]) {
          const start = new Date(year, month, day, Number(dm[4]), Number(dm[5]), 0, 0);
          const end = new Date(start.getTime() + 59999);
          or.push({ hora_ini: { $gte: start, $lte: end } }, { hora_fim: { $gte: start, $lte: end } });
        } else {
          const start = new Date(year, month, day, 0, 0, 0, 0);
          const end = new Date(year, month, day, 23, 59, 59, 999);
          or.push({ hora_ini: { $gte: start, $lte: end } }, { hora_fim: { $gte: start, $lte: end } });
        }
      } else {
        // 2) ISO / YYYY-MM-DD / YYYY-MM-DDTHH:MM
        const iso = new Date(qRaw);
        if (!isNaN(iso.getTime())) {
          const hasTime = qRaw.includes(':');
          if (hasTime) {
            const start = new Date(iso);
            const end = new Date(start.getTime() + 59999);
            or.push({ hora_ini: { $gte: start, $lte: end } }, { hora_fim: { $gte: start, $lte: end } });
          } else {
            const start = new Date(iso.getFullYear(), iso.getMonth(), iso.getDate(), 0, 0, 0, 0);
            const end = new Date(iso.getFullYear(), iso.getMonth(), iso.getDate(), 23, 59, 59, 999);
            or.push({ hora_ini: { $gte: start, $lte: end } }, { hora_fim: { $gte: start, $lte: end } });
          }
        } else {
          // 3) valor_total: número ou range "10-50"
          const rangeMatch = qRaw.match(/^(\d+[.,]?\d*)\s*-\s*(\d+[.,]?\d*)$/);
          if (rangeMatch) {
            const a = parseFloat(rangeMatch[1].replace(',', '.'));
            const b = parseFloat(rangeMatch[2].replace(',', '.'));
            if (!isNaN(a) && !isNaN(b)) {
              or.push({ valor_total: { $gte: Math.min(a, b), $lte: Math.max(a, b) } });
            }
          } else {
            const num = parseFloat(qRaw.replace(',', '.'));
            if (!isNaN(num)) {
              or.push({ valor_total: num });
            } else {
              // 4) fallback: pesquisar por campos textuais relacionados se existirem
              // Se sua Sessao tem referências (ex: jogoNome, clienteNome) adicione aqui:
              // or.push({ 'jogoNome': { $regex: qRaw, $options: 'i' } }, { 'clienteNome': { $regex: qRaw, $options: 'i' } });
              // Se não houver campo textual, nenhuma correspondência possível -> retorna vazio
              docs = [];
            }
          }
        }
      }

      if (or.length) docs = await Sessao.find({ $or: or }).lean();
    }

    // formata para a view
    const sessao = (docs || []).map(doc => {
      const obj = { ...doc };
      if (obj.hora_ini) {
        const dt = new Date(obj.hora_ini);
        obj.hora_ini_formatada = dt.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      }
      if (obj.hora_fim) {
        const dt = new Date(obj.hora_fim);
        obj.hora_fim_formatada = dt.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      }
      return obj;
    });

    res.render('sessao/lst', { sessao, q: qRaw });
  } catch (err) {
    console.error('Erro em /sessao/lst:', err);
    res.render('sessao/lst', { sessao: [], q: req.query.q || '' });
  }
});

app.get('/sessao/add', (req, res) => {
    res.render("sessao/add")
})

app.post('/sessao/add/ok', async (req, res) => {
    await Sessao.create(req.body)
    res.render("sessao/addok" )
})

app.get('/sessao/edt/:id', async (req, res) => {
    try {
        const doc = await Sessao.findById(req.params.id);
        if (!doc) return res.status(404).send('Sessão não encontrada');
        
        const sessao = doc.toObject();
        
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
        
        res.render("sessao/edt", {sessao});
    } catch (err) {
        console.error('Erro ao editar sessão:', err);
        res.status(500).send('Erro ao buscar sessão');
    }
});

app.post('/sessao/edt/:id', async (req, res) => {
    try {
        if (req.body.hora_ini) {
            req.body.hora_ini = new Date(req.body.hora_ini);
        }
        if (req.body.hora_fim) {
            req.body.hora_fim = new Date(req.body.hora_fim);
        }
        
        await Sessao.findByIdAndUpdate(req.params.id, req.body);
        res.render("sessao/edtok");
    } catch (err) {
        console.error('Erro ao salvar sessão:', err);
        res.status(500).send('Erro ao salvar alterações');
    }
});

app.get('/sessao/del/:id', async (req, res) => {
    await Sessao.findByIdAndDelete(req.params.id)
    res.redirect("/sessao/lst")
})

//=============== S I T E ================

app.get('/site', async (req, res) => {
    res.render("site/index")
})

app.listen(3000)