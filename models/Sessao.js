import conexao from "../config/conexao.js";

const SessaoSchema = conexao.Schema({
    id_cliente:{type:conexao.Schema.Types.ObjectId, ref:"Cliente"},
    id_maquina:{type:conexao.Schema.Types.ObjectId, ref:"Maquina"},
    id_jogo:{type:conexao.Schema.Types.ObjectId, ref:"Jogo"},
    duracao:{type:Number},
    data:{type:Date},
    hora:{type:String},
    valor_total:{type:Number},
    status:{type:String},
    sessões_ativas:{type:Number},
    sessoes_dia:{type:Number},
    receita_dia:{type:Number}
})

const Sessao = conexao.model("Sessao", SessaoSchema);
export default Sessao