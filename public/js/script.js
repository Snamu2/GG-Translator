let txtInput
let useGPT4 = false
let useGemini = false
let model

const initURL = `${window.location.origin}${window.location.pathname}`;
window.history.pushState({ path: initURL }, '', initURL);

async function GGai(param, callback) {

    // console.log(txtInput);
    // console.log(param);

    if (param == txtInput) {
        if (param == '') {
            callback('Empty');
        }
        else {
            try {
                model = useGPT4 ? 'gpt-4' : 'gpt-3.5-turbo';
                if (useGemini) {
                    model = 'gemini-1.5-flash-latest'
                }
                const response = await fetch(`/?model=${model}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        param: param
                    })
                })

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Network response was not ok');
                }

                const data = await response.json();
                console.log(data)
                var contentWithLineBreaks = data.replace(/\n/g, '<br>')
                callback(contentWithLineBreaks);
            } catch (error) {
                console.error('There was a problem with the fetch operation:', error.message);
                callback(error.message || 'fetch error');
            }
        }
    }
    else {
        callback('Easter egg')
    }

}

document.querySelector('#Translate').addEventListener('click', () => {
    document.querySelector('#Translate').disabled = true;
    txtInput = document.querySelector('#txtSource').value;

    console.log(txtInput);
    
    GGai(txtInput, function(txtOutput) {
        // console.log(txtOutput);
        var template = `<div class ="line">
            <span>${txtOutput}</span>
        </div>`
        document.querySelector('#txtOutput').insertAdjacentHTML('beforeend', template);
    });
    
})

document.querySelector('#Clear').addEventListener('click', () => {
    document.querySelector('#Clear').disabled = true;
    document.querySelector('#txtSource').value = '';
    document.querySelector('#txtOutput').innerHTML = '';
    document.querySelector('#Clear').disabled = false;
    document.querySelector('#Translate').disabled = false;
    document.getElementById('charCount').textContent = '0' + ' / ' + maxLength;
    document.querySelector('#txtSource').focus();
    console.log('Clear 꿀리어!');

})

document.querySelector('#viewOnlyBtn').addEventListener('click', () => {
    window.open('/view_only', '_blank');
})
document.querySelector('#discord-app').addEventListener('click', () => {
    window.open('/app/discord/GGT', '_blank');
})


var txtArea = document.getElementById("txtSource");
function adjustTextArea() {
    txtArea.style.height = "1px";
    txtArea.style.height = (txtArea.scrollHeight) + "px";
    // txtArea.style.width = window.innerWidth * 0.8 + "px";
}
txtArea.addEventListener("input", adjustTextArea);
window.addEventListener("resize", adjustTextArea);
adjustTextArea();


var txtSource = document.getElementById('txtSource');
var charCount = document.getElementById('charCount');
const maxLength = 30;

txtSource.addEventListener('input', () => {
    var text = txtSource.value;
    var currentLength = text.length;
    charCount.textContent = currentLength + ' / ' + maxLength;

    if (currentLength > maxLength) {
        txtSource.value = text.substring(0, maxLength);
        charCount.textContent = maxLength + ' / ' + maxLength;
    }
});

document.getElementById("toggleSwitch").addEventListener("click", () => {
  document.getElementById("toggleSwitch").classList.toggle("on");
  useGPT4 = !useGPT4
  model = useGPT4 ? 'gpt-4' : 'gpt-3.5-turbo';
  if (document.getElementById("geminitoggleSwitch").classList.contains("on")) {
    model = 'gemini-1.5-flash-latest'
  }
  const modelURL = `${window.location.origin}${window.location.pathname}?model=${model}`;
  window.history.pushState({ path: modelURL }, '', modelURL);
})

document.getElementById("geminitoggleSwitch").addEventListener("click", () => {
  document.getElementById("geminitoggleSwitch").classList.toggle("on");
  useGemini = !useGemini
  model = useGemini ? 'gemini-1.5-flash-latest' : 'gpt-3.5-turbo';
  if (!document.getElementById("geminitoggleSwitch").classList.contains("on") && document.getElementById("toggleSwitch").classList.contains("on")) {
    model = 'gpt-4'
  }
  const modelURL = `${window.location.origin}${window.location.pathname}?model=${model}`;
  window.history.pushState({ path: modelURL }, '', modelURL);
})
