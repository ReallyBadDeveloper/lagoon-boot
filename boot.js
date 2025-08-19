document.getElementById("start").addEventListener("click", async()=>{
let terminalElement = document.querySelector("p")
terminalElement.style.display = "block"
document.getElementById("start").style.display = "none"
const sleep = (ms)=>new Promise((r)=>setTimeout(r, ms))


const terminalAPI = {}
window.terminalAPI = terminalAPI
terminalAPI.write = (text)=>{
    terminalElement.textContent+=text
}
terminalAPI.clear = ()=>{
    terminalElement.textContent = ""
}
terminalAPI.getInput = ()=>{
    return new Promise((r)=>{
        let text = ""
        let answerSpan = document.createElement("span")
        terminalElement.appendChild(answerSpan) 
        const keyListener = (ev)=>{

            console.log(ev.key)
            if(ev.key.length==1){
                answerSpan.textContent += ev.key
                text+=ev.key
            }else{
                switch (ev.key) {
                    case "Enter":
                        window.removeEventListener("keydown", keyListener)
                        answerSpan.textContent += '\n'
                        r(text)
                        break;
                    case "Backspace":
                        text = text.slice(0,text.length-1)
                        answerSpan.textContent = text
                        console.log(text)
                        break;
                    default:
                        break;
                }
            }
            
            
        }
        window.addEventListener("keydown", keyListener)
    })
}
terminalAPI.clear()
terminalAPI.write("Requesting permission to a folder to boot from\n")
let rootDirectory = await window.showDirectoryPicker()
window.rootDirectory = rootDirectory
console.log(rootDirectory)


    function readFileAsync(file, isText=true) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
        resolve(reader.result);
        };
        reader.onerror = reject;
        if(!isText)reader.readAsArrayBuffer(file);
        if(isText)reader.readAsText(file);
    })
    }

    async function FindFileInDir(dir, name){
         for await(const handle of dir.values()) {
      if(handle.kind=="file"){
        let file = await handle.getFile()
        if(file.name==name){
            return file
        }
      }
    }
    }

    let osConf = (await readFileAsync(await FindFileInDir(rootDirectory, "os.conf"))).split("\n").map(e=>e.split("="))
    let mainName = osConf.find(e=>e[0]=="main")[1]
    if(mainName){
        terminalAPI.write("Loading OS...")
        let mainContents = (await readFileAsync(await FindFileInDir(rootDirectory, mainName)))
        await sleep(1000)

        
        eval(";(async()=>{"+mainContents+"})();")
        return;
    }
    terminalAPI.write("Failed to find main in os.conf\n")
    




})
