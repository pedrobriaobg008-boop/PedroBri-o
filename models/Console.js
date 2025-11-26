import conexao from "../config/conexao.js";

const ConsoleSchema = conexao.Schema({
    nome:{type:String},
    fabricante:{type:String},
    status:{type:String},
    preco_hora:{type:Number},
    data_aquisicao:{type:Date},
    foto:{type:Buffer,  get: (valor) => {
           if (!valor) return null;
             return `data:image/png;base64,${valor.toString('base64')}`;
    }}
})

const Console = conexao.model("Console", ConsoleSchema)
export default Console