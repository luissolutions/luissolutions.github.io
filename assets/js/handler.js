const handlers = {
  'contact.html': function () {
    const form = document.querySelector('.form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const messageInput = document.getElementById('message');
    const submitButton = document.getElementById('submitBtn');
    const emailText = document.getElementById('email-text');

    function copyToClipboard(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    emailText.addEventListener('click', function () {
      copyToClipboard(emailText.textContent);

      emailText.textContent = 'Email Copied to Clipboard.';
      emailText.style.color = 'grey';

      setTimeout(() => {
        emailText.textContent = 'Luis@SmartElectronicsSolutions.com';
        emailText.style.color = '';
      }, 2000);
    });

    submitButton.addEventListener('click', function (e) {
      e.preventDefault();

      // Get form field values
      const name = nameInput.value;
      const email = emailInput.value;
      const phone = phoneInput.value;
      const message = messageInput.value;

      // Save form data in LocalStorage
      const formData = {
        name,
        email,
        phone,
        message
      };
      localStorage.setItem('formData', JSON.stringify(formData));

      // Create email body
      const emailBody = `${message} %0D%0A %0D%0A ${name} %0D%0A ${phone} %0D%0A ${email}`;

      // Create the subject line
      const subject = `Contact Request from ${name}`;

      // Use mailto to open the default email client with pre-filled information
      window.location.href = `mailto:smartelectronicssolutionsllc@gmail.com?subject=${encodeURIComponent(subject)}&body=${emailBody}`;
    });
  },
  'calc.html': function () {
    class Calculator {
      constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement
        this.currentOperandTextElement = currentOperandTextElement
        this.clear()
      }

      clear = () => {
        this.currentOperand = ''
        this.previousOperand = ''
        this.operation = undefined
      }

      delete = () => {
        this.currentOperand = this.currentOperand.toString().slice(0, -1)
      }

      appendNumber = (number) => {
        if (number === '.' && this.currentOperand.includes('.')) return
        this.currentOperand = this.currentOperand.toString() + number.toString()
      }

      chooseOperation = (operation) => {
        if (this.currentOperand === '') return
        this.operation = operation
        this.previousOperand = this.currentOperand
        this.currentOperand = ''
        this.updateDisplay()
      }

      updateResult = () => {
        if (this.operation === undefined || this.previousOperand === '') return
        this.compute()
        this.updateDisplay()
      }
      compute = () => {
        let computation
        const prev = parseFloat(this.previousOperand)
        const current = parseFloat(this.currentOperand)
        if (isNaN(prev) || isNaN(current)) return
        switch (this.operation) {
          case '+':
            computation = prev + current
            break
          case '-':
            computation = prev - current
            break
          case '*':
            computation = prev * current
            break
          case '÷':
            computation = prev / current
            break
          default:
            return
        }
        this.currentOperand = computation
        this.operation = undefined
        this.previousOperand = ''
      }

      getDisplayNumber = (number) => {
        const stringNumber = number.toString()
        const integerDigits = parseFloat(stringNumber.split('.')[0])
        const decimalDigits = stringNumber.split('.')[1]
        let integerDisplay
        if (isNaN(integerDigits)) {
          integerDisplay = ''
        } else {
          integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 })
        }
        if (decimalDigits != null) {
          return `${integerDisplay}.${decimalDigits}`
        } else {
          return integerDisplay
        }
      }

      updateDisplay = () => {
        this.currentOperandTextElement.innerText =
          this.getDisplayNumber(this.currentOperand)
        if (this.operation != null) {
          this.previousOperandTextElement.innerText =
            `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`
        } else {
          this.previousOperandTextElement.innerText = ''
        }
      }
    }

    const [previousOperandTextElement, currentOperandTextElement] = document
      .querySelectorAll('[data-previous-operand], [data-current-operand]');
    const calculatorContainer = document.querySelector('.calculator');
    const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

    calculatorContainer.addEventListener('click', (event) => {
      const { target } = event;
      if (target.matches('[data-number]')) {
        calculator.appendNumber(target.innerText);
        calculator.updateDisplay();
      } else if (target.matches('[data-operation]')) {
        calculator.chooseOperation(target.innerText);
        calculator.updateDisplay();
      } else if (target.matches('[data-all-clear]')) {
        calculator.clear();
        calculator.updateDisplay();
      } else if (target.matches('[data-delete]')) {
        calculator.delete();
        calculator.updateDisplay();
      } else if (target.matches('[data-equals]')) {
        calculator.compute();
        calculator.updateDisplay();
      }
    });
  },
  'login.html': function () {
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", event => {
      event.preventDefault();
      var username = document.getElementById("username").value;
      var password = document.getElementById("password").value;

      // Check if the username and password are correct
      if (username === "admin" && password === "password") {
        const token = "1234567890";
        const expirationMinutes = 480;
        const expirationTime = new Date().getTime() + (expirationMinutes * 60 * 1000);
        const tokenData = { token, expiresAt: expirationTime };
        localStorage.setItem("token", JSON.stringify(tokenData));

        const delay = expirationTime - new Date().getTime();
        setTimeout(() => localStorage.removeItem("token"), delay);

        // Clear the form
        loginForm.reset();
        fetch('pages/about.html')
          .then(response => response.text())
          .then(data => {
            // Replace the content of the bodyContainer with the fetched content
            document.getElementById('bodyContainer').innerHTML = data;
          });
      } else {
        alert("Invalid username or password. Please try again.");
      }
    });
  },
  'theme.html': function () {
    const themeSelector = document.querySelector('.theme-selector');
    const link = document.querySelector('link[rel="stylesheet"]');

    // Load the theme from localStorage if one is set
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      link.href = savedTheme;

      // Update radio button to be checked based on the saved theme
      const radioButton = document.querySelector(`input[value="${savedTheme}"]`);
      if (radioButton) {
        radioButton.checked = true;
      }
    }

    themeSelector.addEventListener('change', function (e) {
      const theme = e.target.value;
      link.href = theme;

      // Save the selected theme to localStorage
      localStorage.setItem('theme', theme);
    });
  },
  'apps.html': function () {
    var appNames = [
      "notes",
      "password",
      "timer",
      "mileage",
      "gas",
      "count",
      "invoice",
      "calc",
      "budget",
      "conversion",
      "percent",
      "blackjack",
      "mousegame",
      "mathgame",
      "chess",
      "viewer",
      "gallery"
    ];

    var pages = appNames.map(function (name) {
      return "apps/" + name + ".html";
    });

    var iframe = document.getElementById('myIframe');
    var appButtons = document.getElementById('appButtons');
    var currentIndex = localStorage.getItem('currentIndex') || 0;

    function setIframeSrc(index) {
      currentIndex = index;
      iframe.src = pages[index];
      localStorage.setItem('currentIndex', currentIndex);

      // Reset the height of the iframe
      iframe.style.height = '';

      // When the new source is loaded, adjust the iframe's height
      iframe.onload = function () {
        iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
      }
    }

    function cycleIframeSrc(isNext) {
      currentIndex = isNext ? (currentIndex + 1) % pages.length : (currentIndex - 1 + pages.length) % pages.length;
      setIframeSrc(currentIndex);
    }

    function generateButtons() {
      var buttonsHTML = `<button id="prevButton">⬆️</button>`;

      appNames.forEach((name, index) => {
        buttonsHTML += `<button class="appButton" data-index="${index}">${name.toUpperCase()}</button>`;
      });

      buttonsHTML += `<button id="nextButton">⬇️</button>`;

      appButtons.innerHTML = buttonsHTML;

      document.getElementById("prevButton").addEventListener("click", function () {
        cycleIframeSrc(false);
      });

      Array.from(document.getElementsByClassName("appButton")).forEach(button => {
        button.addEventListener("click", function () {
          setIframeSrc(parseInt(this.dataset.index));
        });
      });

      document.getElementById("nextButton").addEventListener("click", function () {
        cycleIframeSrc(true);
      });
    }

    setIframeSrc(currentIndex);
    generateButtons();
  },
  'notes.html': function () {
    // Notes JS
    const nameInput = document.getElementById('input-name');
    const notesTextarea = document.getElementById('notes');
    const copyBtn = document.getElementById('copy-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const loadBtn = document.getElementById('load-btn');
    const exportBtn = document.getElementById('export-btn');
    const clearBtn = document.getElementById('clear-btn');

    copyBtn.addEventListener('click', copyNote);
    pasteBtn.addEventListener('click', pasteNote);
    saveBtn.addEventListener('click', saveNote);
    deleteBtn.addEventListener('click', deleteNote);
    loadBtn.addEventListener('click', loadNote);
    exportBtn.addEventListener('click', exportNotes);
    clearBtn.addEventListener('click', clearNoteInputs);

    function copyNote() {
      notesTextarea.select();
      document.execCommand('copy');
      alert('Copied to clipboard');
    }

    async function pasteNote() {
      const clipboardData = await navigator.clipboard.readText();
      notesTextarea.value += clipboardData;
    }

    function saveNote() {
      const nameToSave = nameInput.value.trim();
      let savedNotes = JSON.parse(localStorage.getItem('notes')) || [];
      const existingNoteIndex = savedNotes.findIndex(note => note.name.trim() === nameToSave);

      if (existingNoteIndex !== -1) {
        savedNotes[existingNoteIndex].note = notesTextarea.value;
      } else {
        savedNotes.push({ name: nameToSave, note: notesTextarea.value });
      }

      localStorage.setItem('notes', JSON.stringify(savedNotes));
      nameInput.value = '';
      notesTextarea.value = '';
    }

    function deleteNote() {
      const nameToDelete = nameInput.value.trim();
      let savedNotes = JSON.parse(localStorage.getItem('notes')) || [];
      const filteredNotes = savedNotes.filter(note => note.name.trim() !== nameToDelete);

      if (filteredNotes.length < savedNotes.length) {
        localStorage.setItem('notes', JSON.stringify(filteredNotes));
        alert(`Deleted the note with name: ${nameToDelete}`);
      } else {
        alert(`No note found with name: ${nameToDelete}`);
      }
    }

    let currentNoteIndex = 0;

    function loadNote() {
      let savedNotes = JSON.parse(localStorage.getItem('notes')) || [];
      if (savedNotes.length > 0) {
        const selectedNote = savedNotes[currentNoteIndex];
        nameInput.value = selectedNote.name;
        notesTextarea.value = selectedNote.note;
        currentNoteIndex = (currentNoteIndex + 1) % savedNotes.length;
      } else {
        alert('No saved notes to load');
      }
    }

    function exportNotes() {
      let savedNotes = JSON.parse(localStorage.getItem('notes')) || [];
      let notesText = savedNotes.map(note => `Name: ${note.name}\nNote: ${note.note}`).join('\n\n');
      let notesBlob = new Blob([notesText], { type: "text/plain;charset=utf-8" });
      let downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(notesBlob);
      downloadLink.download = 'notes.txt';
      downloadLink.click();
    }

    function clearNoteInputs() {
      nameInput.value = '';
      notesTextarea.value = '';
    }

    // Tasks JS
    let tasks = [];

    if (localStorage.getItem('tasks')) {
      tasks = JSON.parse(localStorage.getItem('tasks'));
      displayTasks();
    }

    function displayTasks() {
      const tasksContainer = document.getElementById('tasks-container');
      tasksContainer.innerHTML = '';

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const li = document.createElement('li');
        li.textContent = task;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', function () {
          deleteTask(i);
        });

        li.appendChild(deleteBtn);
        tasksContainer.appendChild(li);
      }
    }

    function addTask() {
      const taskInput = document.getElementById('task-input');
      const task = taskInput.value.trim();

      if (task) {
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskInput.value = '';
        displayTasks();
      }
    }
    document.getElementById('addTaskBtn').addEventListener('click', addTask);

    function deleteTask(index) {
      tasks.splice(index, 1);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      displayTasks();
    }

    function exportTasksToCSV() {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Task\n";

      for (const task of tasks) {
        csvContent += task + "\n";
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "tasks.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    document.getElementById('ExportButton').addEventListener('click', exportTasksToCSV);


    window.onload = function () {
      displayTasks();
    };
  },
  'password.html': function () {
    const resultEl = document.getElementById('result');
    const lengthEl = document.getElementById('length');
    const uppercaseEl = document.getElementById('uppercase');
    const lowercaseEl = document.getElementById('lowercase');
    const numbersEl = document.getElementById('numbers');
    const symbolsEl = document.getElementById('symbols');
    const generateEl = document.getElementById('generate');

    const randomFunc = {
      lower: getRandomLower,
      upper: getRandomUpper,
      number: getRandomNumber,
      symbol: getRandomSymbol
    };

    resultEl.addEventListener('click', () => {
      const textarea = document.createElement('textarea');
      const password = resultEl.innerText;

      if (!password) { return; }

      textarea.value = password;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();

      resultEl.innerText = 'Copied to clipboard!';
      setTimeout(() => {
        resultEl.innerText = password;
      }, 1000);
    });

    generateEl.addEventListener('click', () => {
      const length = +lengthEl.value;
      const hasLower = lowercaseEl.checked;
      const hasUpper = uppercaseEl.checked;
      const hasNumber = numbersEl.checked;
      const hasSymbol = symbolsEl.checked;

      resultEl.innerText = generatePassword(hasLower, hasUpper, hasNumber, hasSymbol, length);
    });
    function generatePassword(lower, upper, number, symbol, length) {
      let generatedPassword = '';
      const typesCount = lower + upper + number + symbol;
      const typesArr = [{ lower }, { upper }, { number }, { symbol }].filter(item => Object.values(item)[0]);

      // Doesn't have a selected type
      if (typesCount === 0) {
        return '';
      }

      // create a loop
      for (let i = 0; i < length; i += typesCount) {
        typesArr.forEach(type => {
          const funcName = Object.keys(type)[0];
          generatedPassword += randomFunc[funcName]();
        });
      }

      const finalPassword = generatedPassword.slice(0, length);

      return finalPassword;
    }

    function getRandomLower() {
      return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }

    function getRandomUpper() {
      return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
    }

    function getRandomNumber() {
      return +String.fromCharCode(Math.floor(Math.random() * 10) + 48);
    }

    function getRandomSymbol() {
      const symbols = '!@#$%^&*(){}[]=<>/,.'
      return symbols[Math.floor(Math.random() * symbols.length)];
    }

    const conversionTable1 = {
      'c': 7, 'C': 7,
      'r': 4, 'R': 4,
      's': 0, 'S': 0, 'z': 0, 'Z': 0,
      't': 1, 'T': 1, 'd': 1, 'D': 1,
      'n': 2, 'N': 2,
      'm': 3, 'M': 3,
      'l': 5, 'L': 5,
      'j': 6, 'J': 6,
      'k': 7, 'K': 7, 'q': 7, 'Q': 7,
      'f': 8, 'F': 8, 'v': 8, 'V': 8,
      'p': 9, 'P': 9, 'b': 9, 'B': 9
    };

    const conversionTable2 = {
      'a': 1, 'A': 1,
      'b': 2, 'B': 2,
      'c': 3, 'C': 3,
      'd': 4, 'D': 4,
      'e': 5, 'E': 5,
      'f': 6, 'F': 6,
      'g': 7, 'G': 7,
      'h': 8, 'H': 8,
      'i': 9, 'I': 9,
      'j': 10, 'J': 10,
      'k': 11, 'K': 11,
      'l': 12, 'L': 12,
      'm': 13, 'M': 13,
      'n': 14, 'N': 14,
      'o': 15, 'O': 15,
      'p': 16, 'P': 16,
      'q': 17, 'Q': 17,
      'r': 18, 'R': 18,
      's': 19, 'S': 19,
      't': 20, 'T': 20,
      'u': 21, 'U': 21,
      'v': 22, 'V': 22,
      'w': 23, 'W': 23,
      'x': 24, 'X': 24,
      'y': 25, 'Y': 25,
      'z': 26, 'Z': 26,
    };

    const inputBoxEl = document.getElementById('input-box');
    const conversionTypeEl = document.getElementById('conversion-type');

    function convertText(text, conversionTable) {
      return text.split('').map(char => {
        if (conversionTable[char]) {
          return conversionTable[char];
        } else {
          return char;
        }
      }).join('');
    }

    inputBoxEl.addEventListener('input', () => {
      const selectedConversionTable = conversionTypeEl.value === 'table1' ? conversionTable1 : conversionTable2;
      const inputBoxValue = inputBoxEl.value;
      const convertedText = convertText(inputBoxValue, selectedConversionTable);
      const alternateCapsText = alternateCaps(convertedText); // Add this line
      inputBoxEl.value = alternateCapsText; // Update the input box with the converted text
      document.getElementById('input-counter').innerText = alternateCapsText.length; // Update the character count
    });

    function alternateCaps(text) {
      let result = '';
      for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (i % 2 === 0) {
          char = char.toUpperCase();
        } else {
          char = char.toLowerCase();
        }

        if (char === 's' || char === 'S') {
          char = '$';
        } else if (char === 'a' || char === 'A') {
          char = '@';
        }

        result += char;
      }
      return result;
    }

    const copyInputEl = document.getElementById('copy-input');
    copyInputEl.addEventListener('click', () => {
      const inputBox = document.getElementById('input-box');
      const password = inputBox.value;

      if (password) {
        localStorage.setItem('copiedPassword', password);

        // Copy to clipboard
        const textarea = document.createElement('textarea');
        textarea.value = password;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        copyInputEl.innerText = 'Copied!';
        setTimeout(() => {
          copyInputEl.innerText = 'Copy';
        }, 1000);

        // Remove from local storage
        setTimeout(() => {
          localStorage.removeItem('copiedPassword');
        }, 1000); // Remove after 5 seconds
      }
    });
  },
};
