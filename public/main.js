let filterBAYCData = {};

async function startMain() {
    console.log('Start main');
    getAggregatedData();
}

function getAggregatedData() {
    $('#spinnerGlobal').show();
    $.get("/aggdata",)
        .done(async function (res) {
            console.log(res);
            createFilter(res.result.aggregatedData, res.result.allTokens);
            if (res.result.busy) {
                $('#busyInd').text('Retrieving data (' + res.result.allTokens.length + ') ... Refresh page after few minutes');
            } else {
                $('#busyInd').text('');
            }
            $('#spinnerGlobal').hide();
        })
        .fail(function (err) {
            console.error(err);
            $('#spinnerGlobal').hide();
        });
}

function createFilter(aggData, allTokens) {
    //console.log('create filter');
    //console.log(aggData);
    let filterBAYC = document.getElementById('filterBAYC');
    filterBAYC.innerHTML = '';
    let accordion = document.createElement('div');
    accordion.id = 'accordion';


    //for (let i = 0; i < Object.keys(aggData).length; i ++) {
    let i = 0;
    for (const [key, value] of Object.entries(aggData)) {
        i++;
        //console.log(value, key);
        let count = Object.keys(value).length;
        //console.log(Object.keys(aggData)[i]);
        let collapseID = 'trait' + i;
        let card = document.createElement('div');
        card.classList.add('card');

        let cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header');
        cardHeader.id = 'h' + i;
        let cardButton = document.createElement('button');
        cardButton.classList.add('btn');
        cardButton.classList.add('btn-link');
        cardButton.textContent = key + '     (' + count + ')';
        cardButton.dataset.toggle = 'collapse';
        cardButton.dataset.target = '#' + collapseID;
        if (i === 1) {
            cardButton.ariaExpanded = 'true';
        }
        cardButton.ariaControls = collapseID;
        cardHeader.appendChild(cardButton);
        card.appendChild(cardHeader);

        /* content */
        let collapse = document.createElement('div');
        collapse.classList.add('collapse');
        if (i === 1) {
            collapse.classList.add('show');
        }
        collapse.id = collapseID;
        collapse.dataset.parent = '#accordion';
        let collapseBody = document.createElement('div');
        collapseBody.classList.add('card-body');

        /* list of values */
        let listValues = document.createElement('ul');
        listValues.classList.add('list-group');
        for (const [k, v] of Object.entries(value)) {
            let itemValue = document.createElement('li');
            itemValue.classList.add('list-group-item');
            itemValue.classList.add('d-flex');
            itemValue.classList.add('justify-content-between');
            itemValue.classList.add('align-items-center');
            //itemValue.textContent = k;
            /*<div className="custom-control custom-checkbox">
                <input type="checkbox" className="custom-control-input" id="check1" checked>
                    <label className="custom-control-label" htmlFor="check1">Check me</label>
            </div>*/
            let customControl = document.createElement('div');
            //customControl.classList.add('custom-control');
            customControl.classList.add('custom-checkbox');

            let checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            //checkBox.classList.add('custom-control-input');
            checkBox.dataset.trait = key;
            checkBox.id = k;
            checkBox.onclick = function (event) {
                let target = event.target;
                console.log(target.dataset.trait);
                console.log(target.id);
                if (!filterBAYCData[target.dataset.trait]) {
                    filterBAYCData[target.dataset.trait] = [];
                }
                if (!filterBAYCData[target.dataset.trait].includes(target.id)) {
                    filterBAYCData[target.dataset.trait].push(target.id);
                } else {
                    //filterBAYCData[target.dataset.trait].pop(target.id);
                    let x = filterBAYCData[target.dataset.trait].indexOf(target.id);
                    filterBAYCData[target.dataset.trait].splice(x, 1);
                }
                refreshListBAYC_AND(allTokens);
            };

            let checkBoxLabel = document.createElement('label');
            //checkBoxLabel.classList.add('custom-control-label');
            checkBoxLabel.classList.add('margin_left_10');
            checkBoxLabel.for = k;
            checkBoxLabel.textContent = k;

            let badge = document.createElement('span');
            badge.classList.add('badge');
            badge.classList.add('badge-primary');
            badge.classList.add('badge-pill');
            badge.textContent = v;

            customControl.appendChild(checkBox);
            customControl.appendChild(checkBoxLabel);
            itemValue.appendChild(customControl);
            itemValue.appendChild(badge);
            listValues.appendChild(itemValue);
        }
        collapseBody.appendChild(listValues);
        collapse.appendChild(collapseBody);

        accordion.appendChild(card);
        accordion.appendChild(collapse);
    }

    filterBAYC.appendChild(accordion);
}

/**
 * now doesn't work with new data from tatum
 */
function refreshListBAYC_OR(allTokens) {
    //console.log('refreshListBAYC');
    //console.log(filterBAYCData);
    //console.log(allTokens);
    let filteredList = [];
    for (let i = 0; i < allTokens.length; i ++) {
        let token = allTokens[i];
        let tokenAttributes = token.meta.attributes;
        for (let k = 0; k < tokenAttributes.length; k ++) {
            let trait = tokenAttributes[k].trait_type;
            //console.log(trait);
            //console.log(filterBAYCData[trait]);
            //console.log(tokenAttributes[k].value);
            if (filterBAYCData[trait]) {
                if (filterBAYCData[trait].includes(tokenAttributes[k].value)) {
                    console.log('jest token');
                    filteredList.push(token);
                }
            }
        }
    }
    //console.log(filteredList);
    showListTokens(filteredList);
}

function refreshListBAYC_AND(allTokens) {
    //console.log('refreshListBAYC');
    //console.log(filterBAYCData);
    //console.log(allTokens);
    let filteredList = [];
    let traitCount = 0;
    let maxTrait = 0;
    for (let i = 0; i < allTokens.length; i ++) {
        let tokenToAdd = true;
        let token = allTokens[i];
        let tokenAttributes = token.metadata.attributes;
        //console.log(tokenAttributes);
        traitCount = 0;
        maxTrait = 0;
        for (const [k, v] of Object.entries(filterBAYCData)) {
            //console.log(k);
            //console.log(v);
            //console.log(filterBAYCData[trait]);
            if (v.length > 0) {
                maxTrait ++;
                for (let j = 0; j < tokenAttributes.length; j++) {
                    let value = tokenAttributes[j].value;
                    let trait = tokenAttributes[j].trait_type;
                    if (trait === k) {
                        console.log(k);
                        traitCount++;
                        if (!v.includes(value)) {
                            //console.log('token nie pasuje');
                            tokenToAdd = false;
                        }
                    }
                }
            }
        }
        //if (tokenToAdd && (isTrait >= Object.keys(filterBAYCData).length)) {
        if (tokenToAdd && (traitCount >= maxTrait) && (maxTrait > 0)) {
            //console.log('token pasuje do wszystkich');
            //console.log(tokenAttributes);
            filteredList.push(token);
        }

    }
    //console.log(filteredList);
    showListTokens(filteredList);
}

function showListTokens(list) {
    //console.log('showListTokens');
    //console.log(list);
    let listCount = document.getElementById('listCount');
    listCount.textContent = 'Filtered: ' + list.length;
    let listBAYC = document.getElementById('listBAYC');
    listBAYC.innerHTML = '';
    for (let i = 0; i < list.length; i++) {
        listBAYC.appendChild(setItemPanel(list[i]));
    }
}

function setItemPanel(data) {
    //console.log('setItemPanel');
    //console.log(data);
    if (!data) return;
    let el_a = document.createElement('a');
    el_a.classList.add('list-group-item');
    el_a.classList.add('list-group-item-action');

    let el_div = document.createElement('div');
    el_div.classList.add('d-flex');
    el_div.classList.add('w-100');
    el_div.classList.add('justify-content-between');

    let el_h5 = document.createElement('h5');
    el_h5.classList.add('mb-1');
    el_h5.textContent = 'Token no: ' + data.tokenId;

    /*let el_img = document.createElement('img');
    el_img.src = data.meta.imageUrl;*/

    let el_img = document.createElement('a');
    el_img.href = data.imageUrl;
    el_img.target = '_blank';
    el_img.textContent = 'Show image';

    el_div.appendChild(el_h5);
    el_div.appendChild(el_img);
    el_a.appendChild(el_div);

    return el_a;
}


Window.main = {
    startMain: startMain,
}
