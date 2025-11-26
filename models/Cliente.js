import conexao from "../config/conexao.js";

const ClienteSchema = conexao.Schema({
    nome:{type:String},
    cpf:{type:String},
    telefone:{type:String},
    email:{type:String},
    horas_jogadas:{type:Number},
    pontos:{type:Number},
    jogos_favoritos:{type:String},
    plano_assinatura:{type:String},
})

const Cliente = conexao.model("Cliente", ClienteSchema)
export default Cliente