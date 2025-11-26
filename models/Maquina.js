import conexao from "../config/conexao.js";

const MaquinaSchema = conexao.Schema({
    nome_arcade:{type:String},
    jogos_instalados:{type:String},
    condição:{type:String},
    disponibilidade:{type:String},
    conexao_internet:{type:String},
})

const Maquina = conexao.model("Maquina", MaquinaSchema)
export default Maquina