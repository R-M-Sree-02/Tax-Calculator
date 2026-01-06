const key = "xlyOnJZNQ71hEowkDLLk4WLnYgzb21WB";
// const key = "y8QnCQ2aaRteWakKGfDjcpkukq6KMWXv";
const resultContainer = document.getElementById('resultContainer');
const givenPriceSpan = document.getElementById('givenPrice');
const taxRateSpan = document.getElementById('taxRate');
const priceWithTaxSpan = document.getElementById('priceWithTax');
const selectTag = document.getElementById('country');


async function saveSearch(income, countryCode, countryName) {
    console.log(income, countryCode, countryName);
    try {
        const response = await fetch('/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ income, countryCode, countryName })
        });
        if (response.ok) {
            console.log('Search saved to DB');
        } else {
            console.warn('Failed to save search:', await response.text());
        }
    } catch (err) {
        console.error('Save search error:', err);
    }
}

async function calculate(income, country) {
    console.log('fetch called');
    let response = await fetch(
        `https://api.apilayer.com/tax_data/price?amount=${income}&country=${country}`,
        {
            method: 'GET',
            headers: {
                apikey: key
            }
        }
    );
    let data = await response.json();
    const givenPrice = data.price_excl_vat;
    const priceWithTax = Math.round(data.price_incl_vat);
    const taxRate = data.vat_rate;

    printResult(givenPrice, priceWithTax, taxRate);

    console.log('finished with -->> ', givenPrice, priceWithTax, taxRate);
}

function printResult(givenPrice, priceWithTax, taxRate) {
    givenPriceSpan.innerText = givenPrice;
    taxRateSpan.innerText = (taxRate * 100).toFixed(2) + '%';
    priceWithTaxSpan.innerText = priceWithTax;
    resultContainer.style.visibility = 'visible';
    resultContainer.className = 'animation';
}

document.getElementById('taxForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    let income = document.getElementById('income').value;

    const selectedOption = selectTag.options[selectTag.selectedIndex];

    const countryCode = selectedOption.value;
    const countryName = selectedOption.innerText;

    console.log(countryCode, countryName);


    if (!income || !countryCode) {
        document.getElementById('resultContainer').innerText = 'Make sure your Income and Country are selected';
        return;
    }
    console.log('submitted with --  ', income, countryCode);
    calculate(income, countryCode);

    await saveSearch(income, countryCode, countryName);

});

document.getElementById('history').addEventListener('click', () => window.location.href = '/history');




