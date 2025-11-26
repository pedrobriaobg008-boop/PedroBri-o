import conexao from "../config/conexao.js";

const JogoSchema = conexao.Schema({
    titulo:{type:String},
    genero:{type:String},
    popularidade:{type:Number},
    qtde_jogadores:{type:Number},
    recorde:{type:Number},
    foto:{type:Buffer,  get: (valor) => {
           if (!valor) return null;
             return `data:image/png;base64,${valor.toString('base64')}`;
    }}
})

const Jogo = conexao.model("Jogo", JogoSchema);
export default Jogo