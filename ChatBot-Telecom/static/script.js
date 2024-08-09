async function ask() {
    const tweet = document.getElementById('txt').value;
    if (tweet === null || tweet === "") return;
    try {
        const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: tweet }),
        });

        if (!response.ok) {
            throw new Error('Erreur de réseau');
        }
        const data = await response.json();
        const answerDiv = document.getElementById('answer');
        answerDiv.innerHTML = ""; // Clear previous answers

        // Append new message
        const newMessage = document.createElement('div');
        newMessage.innerHTML = '<i class="fa-solid fa-robot"></i> : ' + data.result;
        newMessage.setAttribute("class", "answerP");
        answerDiv.appendChild(newMessage);
        document.getElementById('txt').value = "";

        // Display offers if they exist
        if (data.offers) {
            displayOffers(data.offers);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function displayOffers(offers) {
    const offersContainer = document.getElementById('offers-container');
    offersContainer.innerHTML = ""; // Clear previous offers

    offers.forEach(offer => {
        const offerDiv = document.createElement('div');
        offerDiv.classList.add('offer');

        const offerTitle = document.createElement('h4');
        offerTitle.textContent = offer.name;
        offerDiv.appendChild(offerTitle);

        const offerDescription = document.createElement('p');
        offerDescription.textContent = "Description: " + offer.description;
        offerDiv.appendChild(offerDescription);

        const offerPrice = document.createElement('p');
        offerPrice.textContent = "Prix: " + offer.price;
        offerDiv.appendChild(offerPrice);

        offersContainer.appendChild(offerDiv);
    });
}

// Initial call to display offers when the page loads
window.onload = async function() {
    try {
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error('Erreur de réseau');
        }
        const data = await response.json();
        displayOffers(data.result);
    } catch (error) {
        console.error('Erreur:', error);
    }
};

function go() {
    if (event.key === 'Enter') ask();
    else autocomplete(names.sort());
}

async function fnc() {
    try {
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error('Erreur de réseau');
        }
        const data = await response.json();
        names = data.result;
        return data.result;
    } catch (error) {
        console.error('Erreur:', error);
    }
}

window.onload = fnc;

let names = [];
let Promise = fnc();
Promise.then(data => {
    names = data; // Output: 'Data from the promise'
});

function autocomplete(arr) {
    const inp = document.getElementById("txt");
    let currentFocus;
    inp.addEventListener("input", function(e) {
        let a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    inp.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // up
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function(e) {
        closeAllLists(e.target);
    });
}
