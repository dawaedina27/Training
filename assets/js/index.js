const ID_MODULE_LIST_SIDE_BAR = 'module-list-side-bar';
const ID_MODULE_LIST_TRAINING = 'module-list-training';
const CLASS_DAYBREAK = 'daybreak';
const CLASS_TIMEBREAK = 'timebreak';
const CLASS_MODULE = 'module';
const CLASS_RESOURCE = 'resource';
const CLASS_TRAININGSTART = 'trainingstart';
const CLASS_SUBMITTIME = 'submit';
const CLASS_CLOSETIME = 'close'
const CLASS_EDITTIME = 'edit-time';
const CLASS_MODULEDURATION = 'module-duration';

/**
 * Drag & Drop
 */
const ANIMATION_SPEED = 85;

function initiateSortable() {
    let moduleListTraining = document.getElementById(ID_MODULE_LIST_TRAINING);
    Sortable.create(moduleListTraining, {
        filter: '.trainingstart',
        group: {
            name: 'module_list_training',
            put: true
        },
        fallbackOnBody: true,
        swapThreshold: 0.2,
        animation: ANIMATION_SPEED,
        onAdd: runDynamicCalculationsOnAdd,
        onUpdate: runDynamicCalculationsOnUpdate
    });

    let moduleListSideBar = document.getElementById(ID_MODULE_LIST_SIDE_BAR);
    Sortable.create(moduleListSideBar, {
        group: ID_MODULE_LIST_SIDE_BAR,
        animation: ANIMATION_SPEED
    });

    let breakListSideBar = document.getElementById('break-list-side-bar');
    Sortable.create(breakListSideBar, {
        group: {
            name: 'break-list-side-bar',
            pull: 'clone'
        },
        sort: false,
        onEnd: updateClonedBreaks // we need this because cloning does not copy event listeners added using addEventListener() or those assigned to element properties (e.g., node.onclick = someFunction) (https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode)
    });

    let index = 0;
    let resourceListLists = document.getElementsByClassName('resource-list');
    for (ul of resourceListLists) {
        Sortable.create(ul, {
            group: {
                name: `resource-list-${index}`,
                put: function () {
                    const chosenClassName = document.getElementsByClassName('sortable-chosen')[0].className;
                    const isResource = chosenClassName.includes(CLASS_RESOURCE);
                    const isTimeBreak = chosenClassName.includes(CLASS_TIMEBREAK);
                    const isDayBreak = chosenClassName.includes(CLASS_DAYBREAK);
                    return isResource || isTimeBreak || isDayBreak;
                },
                pull: function () {
                    const chosenClassName = document.getElementsByClassName('sortable-chosen')[0].className;
                    const isTimeBreak = chosenClassName.includes(CLASS_TIMEBREAK);
                    const isDayBreak = chosenClassName.includes(CLASS_DAYBREAK);
                    return isTimeBreak || isDayBreak;
                }
            },
            fallbackOnBody: true,
            animation: ANIMATION_SPEED,
            onAdd: calculateTime,
            onUpdate: calculateTime
        });
        index++;
    }
}

/**
 * Button onclick initialisations
 */

function initiateEditTitle(){
    let editButton = document.getElementById('edit-icon');
    editButton.onclick = showEditTitle;
    let submitButton = document.getElementById('submit-title');
    submitButton.onclick = submitTitle;
}

function showEditTitle(){
    let editTitle = document.getElementById('edit-title-and-description');
    if(editTitle.style.transform == ''){
        editTitle.style.transform = '';
        return;
    }
    editTitle.style.transform = 'scale(1,1)';
}

function submitTitle(){
    let editTitle = document.getElementById('edit-title-and-description');
    if(editTitle.style.transform == 'scale(0,0)'){
        editTitle.style.transform = 'scale(1,1)';
    }

    let form = this.parentNode;
    let title = document.getElementById('training-title');
    let newTitle = getChildByClassName(form, 'title').value;
    if(newTitle != '') title.innerText = newTitle;

    let description = document.getElementById('training-description');    
    let newDescription = getChildByClassName(form, 'description').value;
    if(newDescription != '') description.innerText = newDescription;
}

function initiateEditResourceQuantity(){
    let inputQuantity = document.getElementsByClassName('quantity-input');
    for(let input of inputQuantity){
        input.onchange = editResourceQuantity;
    }
}

function editResourceQuantity(){
    let parentNode = this.parentNode.parentNode;
    let valueEl = getChildByClassName(parentNode, 'material-costs'); 
    let cost = parseInt(valueEl.dataset.cost);
    let oldValue = parseInt(valueEl.innerText);
    let newValue = cost * parseInt(this.value);
    valueEl.innerText = newValue + ' $';
    let totalSumEl = document.getElementById('total-price');
    let totalSum = parseInt(totalSumEl.innerText);
    let newSum = totalSum - oldValue + newValue;
    totalSumEl.innerText = newSum + ' $';
}

function initiateTrashButton() {
    let trashButtons = document.getElementsByClassName('trash');
    for (btn of trashButtons) {
        btn.onclick = onClickDeleteOrMoveListElement
    }
}

function onClickDeleteOrMoveListElement() {
    let currentElement = this;
    while (currentElement.tagName !== 'LI') {
        currentElement = currentElement.parentNode;
    }
    if (currentElement.className.includes(CLASS_MODULE)) {
        let moduleListSideBar = document.getElementById(ID_MODULE_LIST_SIDE_BAR);
        moduleListSideBar.appendChild(currentElement);
        calculateTime();
        calculateSummary();
        return;
    }
    currentElement.remove();
    calculateTime();
    calculateSummary();
}

function initiateTimeEdit(){
    let classesWithTimeButton = [CLASS_MODULE, CLASS_TRAININGSTART, CLASS_TIMEBREAK, CLASS_DAYBREAK]
    initiateTimeButton(classesWithTimeButton);
    initiateSubmitTimeButton();
    initiateCloseButton();
}

function initiateTimeButton(classes){
    for(clazz of classes){
        let trainingstartClock = document.querySelectorAll(`.${clazz} .fa-edit`);
        for(let clock of trainingstartClock){
            clock.onclick = toggleTimeEditWindow;
        }
    }
}

function toggleTimeEditWindow(){
    let timeEdit = getChildByClassName(this.parentNode.parentNode, CLASS_EDITTIME);
    if(timeEdit == null){
        return;
    }
    if(timeEdit.style.display == 'block'){
        timeEdit.style.display = '';
    } else {
        let allTimeEditors = document.querySelectorAll(`.${CLASS_EDITTIME}`);
        for(let editor of allTimeEditors){
            editor.style.display = '';
        }
        timeEdit.style.display = 'block';
    }
}

function initiateSubmitTimeButton(){
    let submitTimeButtons = document.querySelectorAll(`.${CLASS_SUBMITTIME}`);
    for(let button of submitTimeButtons){
        button.onclick = submitTime;
    }
}

function getStartTime(hoursEl, minutesEl, amOrPm){
    let start = '9:00'
    if(hoursEl != null && minutesEl != null){
        if(hoursEl.value === '') hoursEl.value ='9';
        if(minutesEl.value === '') minutesEl.value = '0';
        if(amOrPm.value === 'am'){
            start = `${hoursEl.value}:${minutesEl.value}`;
        } else if(amOrPm.value === 'pm'){
            let hours = parseInt(hoursEl.value) + 12;
            hours = hours === 24 ? 0 : hours;
            start = `${hours}:${minutesEl.value}`;
        }
    }
    return start;
}

function submitTime(){
    const form = this.parentNode;

    const hoursEl = getChildByClassName(form, 'hours');
    const minutesEl = getChildByClassName(form, 'minutes');
    const amOrPm = getChildByClassName(form, 'am-or-pm');
    let start = getStartTime(hoursEl, minutesEl, amOrPm);
    
    let duration = getChildByClassName(form, 'duration').value;
    if(duration === ''){
        duration = '15';
    }

    const titleEl = getChildByClassName(form, 'title');
    
    let currentElement = this;
    let runLoop = true;
    while(runLoop){
        let currClassName = currentElement.className;
        if(currClassName.includes(CLASS_MODULE) 
        || currClassName.includes(CLASS_TRAININGSTART) 
        || currClassName.includes(CLASS_DAYBREAK)
        || currClassName.includes(CLASS_TIMEBREAK)
        || currClassName.includes(CLASS_RESOURCE)){
            currentElement.dataset.duration = duration;
            if (currentElement.className.includes('resource')) {
                let displayEl = currentElement.querySelector('.duration-display');
                if (parseInt(duration) > 0) {
                    displayEl.innerText = `| ${duration} minutes`;
                } else {
                    displayEl.innerText = '';
                }
            }
            if(currClassName.includes(CLASS_TRAININGSTART)
            || currClassName.includes(CLASS_DAYBREAK)){
                currentElement.dataset.start = start;
            }
            if((titleEl != null && titleEl.value != '') 
            && (currClassName.includes(CLASS_TRAININGSTART)
            || currClassName.includes(CLASS_DAYBREAK)
            || currClassName.includes(CLASS_TIMEBREAK))){
                let titleNode = getChildByClassName(currentElement, 'break-title');
                titleNode.innerText = titleEl.value;
            }
            runLoop = false;
        }
        currentElement = currentElement.parentNode;
    }
    
    form.parentNode.style.display = '';
    calculateTime()
}

function initiateCloseButton(){
    let closeTimeButtons = document.querySelectorAll(`.${CLASS_CLOSETIME}`);
    for(let button of closeTimeButtons){
        button.onclick = closeTime;
    }
}

function closeTime(){
    this.parentNode.parentNode.style.display = '';
}

/**
 * Updates a time or day break after it has been cloned
 * @param {Event} evt The dragging event
 */
function updateClonedBreaks(evt){
    let timebreak = evt.item;
    let iconButton = timebreak.querySelector('.fa-edit');
    iconButton.onclick = toggleTimeEditWindow;
    let submitButton = timebreak.querySelector('.submit');
    submitButton.onclick = submitTime;
    let closeButton = timebreak.querySelector('.close');
    closeButton.onclick = closeTime;
    let trashButton = timebreak.querySelector('.trash');
    trashButton.onclick = onClickDeleteOrMoveListElement;
}

/**
 * Mobile button initialisations
 */

function initiateMobileButtons(){
    initiateShowSidebar();
    initiateAddModule();
    initiateCloseSidebar();
    initiateAddTimebreak();
    initiateAddDaybreak();
}

function initiateShowSidebar(){
    let addModule = document.getElementById('add-module-mobile');
    addModule.onclick = showSidebar;
}

function showSidebar(){
    let el = document.getElementById('MultipleContainers');
    if(!el.className.includes('open-sidebar')){
        el.className = el.className.concat('open-sidebar');

        const sideBarModules = document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE);
        for(let mod of sideBarModules){
            mod.draggable = false;
        }
    }
}

function initiateAddModule(){
    let addButtons = document.querySelectorAll(`.${CLASS_MODULE} .add-module`);
    for(let btn of addButtons){
        btn.onclick = addModule;
    }
}

function addModule(){
    let currEl = this.parentNode; // start with parentNode because this className already includes "module" => don't use the component names in class names
    while(!currEl.className.includes(CLASS_MODULE)){
        currEl = currEl.parentNode;
    }
    let moduleList = document.getElementById(ID_MODULE_LIST_TRAINING);
    moduleList.appendChild(currEl);
    calculateTime();
    calculateSummary();
    closeSidebar();
}

function initiateCloseSidebar(){
    let closeSidebarButton = document.getElementById('close-sidebar-mobile');
    closeSidebarButton.onclick = closeSidebar;
}

function closeSidebar(){
    let el = document.getElementById('MultipleContainers');
    if(el.className.includes('open-sidebar')){
        const elClasses = el.className.split(' ');
        const elClassesWithoutSidebar = elClasses.filter(className => className != 'open-sidebar');
        el.className = elClassesWithoutSidebar.join(' ');

        const sideBarModules = document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE);
        for(let mod of sideBarModules){
            mod.draggable = true;
        }
    }
}

function initiateAddTimebreak(){
    let addTimebreakButton = document.getElementById('add-timebreak-mobile');
    addTimebreakButton.onclick = addTimebreak;
}

function addTimebreak(){
    const timeBreak = document.getElementsByClassName(CLASS_TIMEBREAK)[0].cloneNode(true);
    let moduleList = document.getElementById(ID_MODULE_LIST_TRAINING);
    moduleList.appendChild(timeBreak);
    initiateTrashButton();
    calculateTime();
    calculateSummary();
}

function initiateAddDaybreak(){
    let addDaybreakButton = document.getElementById('add-daybreak-mobile');
    addDaybreakButton.onclick = addDaybreak;
}

function addDaybreak(){
    const dayBreak = document.getElementsByClassName(CLASS_DAYBREAK)[0].cloneNode(true);
    let moduleList = document.getElementById(ID_MODULE_LIST_TRAINING);
    moduleList.appendChild(dayBreak);
    initiateTrashButton();
    calculateTime();
    calculateSummary();
}

/**
 * Dynamic Calculations
 */

function runDynamicCalculationsOnUpdate(evt) {
    let mod = evt.item;
    insertTimeBreaks(mod);
    calculateTime();
    calculateSummary();
}

function runDynamicCalculationsOnAdd(evt) {
    let mod = evt.item;
    insertTimeBreaks(mod);
    calculateTime();
    calculateSummary();
    updateAuthorList();
}

function calculateTime() {
    let totalTime = 0;
    let clockTime = new Date();
    let days = 0;

    let trainingstart = document.getElementById(CLASS_TRAININGSTART);
    const duration = parseInt(trainingstart.dataset.duration);
    clockTime = parseDatefromString(clockTime, trainingstart.dataset.start);
    startTime = clockTime;
    clockTime = insertClockTime(clockTime, duration, trainingstart);
    totalTime+=duration;
    days+=1;

    let moduleList = Array.from(document.getElementById(ID_MODULE_LIST_TRAINING).childNodes);
    moduleList = moduleList.filter(el => el.nodeName.includes('LI'));
    for (mod of moduleList) {
        if (mod.className.includes(CLASS_MODULE)) {
            const duration = parseInt(mod.dataset.duration);
            let moduleStartTime = clockTime;
            clockTime = insertClockTime(clockTime, duration, mod);
            totalTime+=duration;

            let resources = document.querySelectorAll(`#${mod.id} li`);
            let moduleEndTime = null;
            for(let el of resources){
                if(el.className.includes(CLASS_DAYBREAK)){
                    clockTime = parseDatefromString(clockTime, el.dataset.start);
                }
                const duration = parseInt(el.dataset.duration);
                clockTime = insertClockTime(clockTime, duration, el);
                moduleEndTime = clockTime;
                totalTime+=duration;
            }

            let moduleDurationEl = getChildByClassName(mod, CLASS_MODULEDURATION);
            const durationSplit = getDurationSplit(moduleEndTime - moduleStartTime)
            if(durationSplit.days != undefined ){
                moduleDurationEl.innerHTML = `<i class="fas fa-hourglass-half"></i>${durationSplit.days} days ${durationSplit.hours} hours ${durationSplit.minutes} minutes`;
            } else {
                moduleDurationEl.innerHTML = `<i class="fas fa-hourglass-half"></i>${durationSplit.hours} hours ${durationSplit.minutes} minutes`;
            }

        } else if (mod.className.includes(CLASS_TIMEBREAK)) {
            const duration = parseInt(mod.dataset.duration);
            clockTime = insertClockTime(clockTime, duration, mod);
            totalTime+=duration;

        } else if(mod.className.includes(CLASS_DAYBREAK)){
            clockTime = addDays(clockTime, 1);
            let duration = parseInt(mod.dataset.duration);
            clockTime = parseDatefromString(clockTime, mod.dataset.start);
            clockTime = insertClockTime(clockTime, duration, mod);
            totalTime+=duration;
            days+=1;
        } 
    }

    updateSummaryDuration(days, totalTime)
}

function updateSummaryDuration(days, totalTime){
    let summaryDuration = getDurationSplit(totalTime*60*1000);
    document.querySelector('#summary-days').innerText = days;
    document.querySelector('#summary-hours').innerText = summaryDuration.hours;
    document.querySelector('#summary-minutes').innerText = summaryDuration.minutes;
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// duration in ms
function getDurationSplit(duration){
    const hoursDiv = 1000 * 60 * 60;
    const hours = Math.floor(duration / hoursDiv);
    duration = duration - hours * hoursDiv;
    const minutesDiv = 1000 * 60;
    const minutes = Math.floor(duration / minutesDiv);
    return {'hours': hours, 'minutes': minutes};
}

function parseDatefromString(clockTime, daytime) {
    const splitDaytime = daytime.split(':');
    clockTime.setHours(splitDaytime[0]);
    clockTime.setMinutes(splitDaytime[1]);
    return clockTime;
}

function insertClockTime(clockTime, duration, mod) {
    let clockTimeSpan = getChildByClassName(mod, 'clock-time');
    if(clockTimeSpan == null){
        return clockTime;
    }
    const oldClockTime = new Date(clockTime);
    clockTime = new Date(clockTime.getTime() + duration * 60 * 1000);
    const clockTimeString = `${convertTimeToString(oldClockTime)} - ${convertTimeToString(clockTime)}`;
    clockTimeSpan.innerText = clockTimeString;
    return clockTime;
}

function convertTimeToString(clockTime) {
    let hour = clockTime.getHours();
    let minute = clockTime.getMinutes();
    let temp = '' + ((hour > 12) ? hour - 12 : hour);
    if (hour == 0)
        temp = '12';
    temp += ((minute < 10) ? ':0' : ':') + minute;
    temp += (hour >= 12) ? 'pm' : 'am';
    return temp;
}

// this function returns the first child node matching the className it finds at the nearest point to the root
function getChildByClassName(el, className){
    let runLoop = true;
    let nextLevelChilds = el.childNodes;
    while(runLoop){
        let currentChilds = nextLevelChilds;
        nextLevelChilds = [];
        for(let i = 0; i < currentChilds.length; i++) {
            nextLevelChilds.push(...currentChilds[i].childNodes);
            if (currentChilds[i].className == className) {
                return currentChilds[i];
            }
        }
        if(nextLevelChilds.length == 0){
            return null;
        }
        currentChilds = nextLevelChilds;
    }
}

const difficultyLevels= {
    0: '-',
    1: 'easy',
    2: 'medium',
    3: 'advanced'
};

function calculateSummary() {
    let moduleListTraining = document.querySelectorAll(`#${ID_MODULE_LIST_TRAINING} .${CLASS_MODULE}`);
    let difficulty = 0;
    let participants = Number.MAX_VALUE;
    let trainer = 0;
    for(mod of moduleListTraining){
        let d = mod.dataset;
        difficulty = parseInt(d.difficulty) > difficulty ? parseInt(d.difficulty) : difficulty;
        participants = parseInt(d.participants) < participants ? parseInt(d.participants) : participants;
        trainer = parseInt(d.trainer) > trainer ? parseInt(d.trainer) : trainer;
    }
    if (moduleListTraining.length === 0) { 
        participants = 0;
        trainer = 0;
    }
    document.querySelector('#number-of-modules').innerText = moduleListTraining.length;
    document.querySelector('#max-participants').innerText = participants;
    document.querySelector('#min-trainers').innerText = trainer;
    document.querySelector('#difficulty').innerText = difficultyLevels[difficulty];

    let resourceList = document.querySelectorAll(`#${ID_MODULE_LIST_TRAINING} .${CLASS_MODULE} .${CLASS_RESOURCE}`);
    let space = 0;
    let internet = 'no';
    let power = 'no';
    let materialCost = [];
    for(resource of resourceList){
        let d = resource.dataset;
        space = parseInt(d.space) > space ? parseInt(d.space) : space;
        if(d.internet === 'yes') internet = 'yes';
        if(d.power === 'yes') power = 'yes';

        if(alreadyInCostList(materialCost, d.name)){
            updateCostList(materialCost, d.name);
        } else {
            let newResource = {'name': d.name, 'cost': parseInt(d.cost), 'count': 1};
            materialCost.push(newResource);
        }
    }
    updateResourceCostList(materialCost);
    document.querySelector('#training-space').innerText = space + 'm2';
    document.querySelector('#internet-needed').innerText = internet;
    document.querySelector('#power-needed').innerText = power;
    document.querySelector('#number-of-resources').innerText = resourceList.length;
}

function alreadyInCostList(l, name){
    return l.map(el => el['name']).includes(name);
}

function updateCostList(l, name){
    let currEl = l.filter(el => el['name'] == name)[0];
    currEl['count']+=1;
}

function updateResourceCostList(l){
    let resourceTable = document.querySelector('#resource-table');
    let costSum = 0;
    resourceTable.innerHTML = `
    <tr>
        <th class="quantity">Quantity</th>
        <th class="resource-name">Name of the resource</th>
        <th class="material-costs">Estimated Material Costs</th>
    </tr>`;
    l.forEach(el => {
        resourceTable.innerHTML+=`
        <tr>
            <th class="quantity"><input class="quantity-input" type="number" min="0" max="1000000" value="${el['count']}"></input></th>
            <th class="resource-name">${el['name']}</th>
            <th class="material-costs" data-cost="${el['cost']}">${el['count'] * el['cost']} $</th>
        </tr>`;
        costSum += el['count'] * el['cost'];
    });
    resourceTable.innerHTML+=`
    <tr class="result">
        <td colspan="2" class="label">Result:</td>
        <td id="total-price">${costSum} $</td>
    </tr>`;
    initiateEditResourceQuantity();
}

/**
 * Time Breaks
 */

const BREAK_INTERVAL = 90;

function initiateTimeBreaks() {
    let moduleListTraining = Array.from(document.getElementById(ID_MODULE_LIST_TRAINING).childNodes);
    moduleListTraining = moduleListTraining.filter(el => el.nodeName.includes('LI') && el.className.includes(CLASS_MODULE));
    for (mod of moduleListTraining) {
        insertTimeBreaks(mod);
    }
}

function insertTimeBreaks(mod) {
    if(!mod.className.includes(CLASS_MODULE)) {
        return;
    }
    let moduleList = Array.from(document.getElementById(ID_MODULE_LIST_TRAINING).childNodes);
    moduleList = moduleList.filter(el => el.nodeName.includes('LI') && el.className.includes(CLASS_MODULE));
    const isLastModule = moduleList[moduleList.length - 1] === mod;

    let durationSum = 0;
    let resources = document.querySelectorAll(`#${mod.id} .${CLASS_RESOURCE}`);
    for (resource of resources) {
        const duration = parseInt(resource.dataset.duration);
        const isLastResource = resources[resources.length - 1] === resource;
        let hasBreakAfter = false;
        let searchBreak = true;
        let currentElement = resource;
        while (searchBreak) { // we do it this way of some strange html (nodeName: '#text') siblings appear on the rendered side inbetween the list elems
            currentElement = currentElement.nextSibling;
            if (currentElement != null && currentElement.nodeName === 'LI' && (currentElement.className.includes(CLASS_TIMEBREAK) || currentElement.className.includes(CLASS_RESOURCE))) {
                if (currentElement.className.includes(CLASS_TIMEBREAK)) {
                    hasBreakAfter = true;
                    searchBreak = false;
                }
                searchBreak = false;
            }
            if (currentElement === null) {
                searchBreak = false;
            }
        }

        if (!isNaN(duration)) {
            durationSum += duration;
        }
        if (duration >= BREAK_INTERVAL && !(isLastModule && isLastResource) && !hasBreakAfter) {
            addTimeBreakAfter(resource);
            durationSum = 0;
        }
    }
}

function addTimeBreakAfter(resource) {
    const MODULE_TIME_BREAK = document.getElementsByClassName(CLASS_TIMEBREAK)[0].cloneNode(true);
    resource.parentNode.insertBefore(MODULE_TIME_BREAK, resource.nextSibling);
    initiateTrashButton();
    initiateTimeEdit();
}

/**
 * Word Cloud Filter
 */

const CLASS_SELECTED = 'selected';
const ID_WORDCLOUD = 'wordcloud';
const ID_SHOW_ALL_CATEGORIES = 'show-all-modules';

function initiateWordcloudFilter() {
    const wordcloud = document.getElementById(ID_WORDCLOUD).getElementsByTagName('li');
    for (li of wordcloud) {
        li.onclick = updateWordcloudFilter;
    }
}

function updateWordcloudFilter() {
    if (this.id === ID_SHOW_ALL_CATEGORIES) {
        if (!this.className.includes(CLASS_SELECTED)) {
            this.className = this.className.concat(CLASS_SELECTED);
            showAllModules();
            return;
        } else {
            const thisClasses = this.className.split(' ');
            const thisClassesWithoutSelected = thisClasses.filter(className => className != CLASS_SELECTED);
            this.className = thisClassesWithoutSelected.join(' ');
            hideAllModules();
            return;
        }
    }
    if (!this.className.includes(CLASS_SELECTED)) {
        this.className = this.className.concat(CLASS_SELECTED);
    } else {
        const thisClasses = this.className.split(' ');
        const thisClassesWithoutSelected = thisClasses.filter(className => className != CLASS_SELECTED);
        this.className = thisClassesWithoutSelected.join(' ');
    }
    updateSelectableModulesList();
}

function unselectAllCategories() {
    const wordcloud = Array.from(document.getElementById(ID_WORDCLOUD).getElementsByTagName('li'));
    for (category of wordcloud) {
        if (category.id != ID_SHOW_ALL_CATEGORIES) {
            const categoryClasses = category.className.split(' ');
            const categoryClassesWithoutSelected = categoryClasses.filter(className => className != CLASS_SELECTED);
            category.className = categoryClassesWithoutSelected.join(' ');
        }
    }
}

function showAllModules() {
    unselectAllCategories()
    const sideBarModules = Array.from(document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE));
    for (mod of sideBarModules) {
        mod.style.display = '';
    }
}

function hideAllModules() {
    unselectAllCategories()
    const sideBarModules = Array.from(document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE));
    for (mod of sideBarModules) {
        mod.style.display = 'none';
    }
}

function updateSelectableModulesList() {
    const wordcloud = Array.from(document.getElementById(ID_WORDCLOUD).getElementsByTagName('li'));
    const wordcloudSelectedCategories = wordcloud.filter(li => li.className.includes(CLASS_SELECTED));
    const selectedCategories = wordcloudSelectedCategories.map(li => li.textContent);

    const sideBarModules = Array.from(document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE));

    let showAllModulesCategory = document.getElementById(ID_SHOW_ALL_CATEGORIES)
    const showAllModulesCategoryClasses = showAllModulesCategory.className.split(' ');
    const showAllModulesCategoryClassesWithoutSelected = showAllModulesCategoryClasses.filter(className => className != CLASS_SELECTED);
    showAllModulesCategory.className = showAllModulesCategoryClassesWithoutSelected.join(' ');

    if (selectedCategories.length == 0) {
        showAllModules();
        let all = document.getElementById('show-all-modules');
        all.className = all.className.concat(CLASS_SELECTED);
        return;
    }

    for (mod of sideBarModules) {
        const modClasses = mod.className.split(' ');
        
        for (category of selectedCategories) {
            if (modClasses.includes(category)) {
                mod.style.display = '';
                break; // --> change around here to implement "AND" filter style. bahaves atm like "OR"
            } else {
                mod.style.display = 'none';
            }
        }
    }
}

/**
 * Author list
 */
function updateAuthorList(){
    updateAuthorLinkTarget();
    let moduleListEl = document.getElementById('module-list-training');
    let authorList =  moduleListEl.querySelectorAll('.author');
    let authorsWithResources = {};
    let identifiedResources = [];
    let identifiedAuthors = [];
    authorList.forEach((authorEl) => {
        let { author, resource, resourceUrl, resourceLicense } = authorEl.dataset;
        if (!identifiedResources.includes(resource)) {
            let license = convertMDLinkToObject(resourceLicense);
            let newResource = {
                name: resource,
                url: resourceUrl,
                license,
            };
            let authors = convertMultipleMDLinksToArray(author);
            authors.forEach((singleAuthor) => {
                if (!identifiedAuthors.includes(singleAuthor.name)) {
                    authorsWithResources[singleAuthor.name] = {};
                    authorsWithResources[singleAuthor.name]['url'] = singleAuthor.url;
                    authorsWithResources[singleAuthor.name]['resources'] = [];
                    identifiedAuthors.push(singleAuthor.name);
                }
                authorsWithResources[singleAuthor.name]['resources'].push(newResource);
            });
            identifiedResources.push(resource);
        }
    });
    let html = '';
    for (author in authorsWithResources) {
        // single author item that contains their name, url, and resources
        let item = authorsWithResources[author];

        let authorHtml = `<li class="author-info"><p><a href="${item.url}" target="_blank"><strong>${author}</strong></a><span class="display-print"> (${item.url})</span></p>`;
        let resourceListEls = '';
        for (resource in item.resources) {
            // Single resource item that includes the name, url, and license of the resource
            let resourceItem = item.resources[resource];

            resourceListEls +=`<li><a href="${resourceItem.url}">${resourceItem.name}</a>`;
            // Add resource link if it exists
            if (resourceItem.url) {
                resourceListEls += `<span class="display-print"> (${resourceItem.url})</span>`;
            }
            // Add license
            if (resourceItem.license.name) {
                resourceListEls += `. License: <a target="_blank" href="${resourceItem.license.url}">${resourceItem.license.name}</a>`;
            }
            // Add license url if it exists
            if (resourceItem.license.url) {
                resourceListEls+= `<span class="display-print"> (${resourceItem.license.url})</span>`;
            }
            // Add closing li tag
            resourceListEls += `</li>`;
        }
        authorHtml += `<ul>${resourceListEls}</ul></li>`;
        html += authorHtml;
    }
    if (html !== '') {
        let referenceListEl = document.getElementById('reference-list');
        referenceListEl.innerHTML = html;
    }
}

/**
 * Creates an object with the name and url from a markdown link
 * @param {String} link markdown link
 * @returns {Object}
 */
function convertMDLinkToObject(link){
    let result = { name: '', url: '' };
    if (!link) return result;
    if(link[0] == '['){
        let regex = /[\[\]\)]/g;
        let [ name, url ] = link.replace(regex, '').split('(');
        result.name = name;
        result.url = url;
        return result;
    }
    result.name = link;
    return result;
}

/**
 * Converts multiple Markdown links separated by commas to array of { name, url } objects
 * @param {String} links
 * @returns {Array<Object>} 
 */
function convertMultipleMDLinksToArray(links){
    let result = [];
    if (links.includes(',')) {
        let singleLinks = links.split(',');
        singleLinks.forEach((link) => {
            let obj = convertMDLinkToObject(link.trim());
            result.push(obj);
        });
        return result;
    }
    let obj = convertMDLinkToObject(links);
    result.push(obj);
    return result;
}

/**
 * Initiates the button for expanding/contracting the author list
 */
function initiateAuthorListToggleButton(){
    let button = document.getElementById('reference-button');
    button.onclick = expandAuthorList;
}

/**
 * Expands the list of authors
 */
function expandAuthorList(){
    let referenceListEl = document.getElementById('reference-list');
    referenceListEl.style.transform = 'scale(1, 1)';
    this.innerHTML = '<i class="fas fa-angle-up"></i>';
    this.onclick = contractAuthorList;
}

/**
 * Contracts the list of authors
 */
function contractAuthorList(){
    let referenceListEl = document.getElementById('reference-list');
    referenceListEl.style.transform = 'scale(0, 0)';
    this.innerHTML = '<i class="fas fa-angle-down"></i>';
    this.onclick = expandAuthorList;
}

/**
 * Updates the author links to open in a new tab
 */
function updateAuthorLinkTarget(){
    let moduleList = document.getElementById('module-list-training');
    let links = moduleList.querySelectorAll('.author-data a');
    links.forEach((link) => {
        link.setAttribute("target", "_blank");
    });
}

/**
 * Allows user to add custom notes
 */
function initiateEditNotes(){
    let editButtons = document.getElementsByClassName('edit-trainer-notes-button');
    for (let editButton of editButtons) {
        editButton.onclick = showEditNotes;
    }
    let submitButtons = document.getElementsByClassName('submit-notes');
    for (let submitButton of submitButtons) {
        submitButton.onclick = submitNotes;
    }
    let dismissButtons = document.getElementsByClassName('close-notes-popup');
    for (let dismissButton of dismissButtons) {
        dismissButton.onclick = dismissEditNotes;
    }
    let resetButtons = document.getElementsByClassName('reset-notes');
    for (let resetButton of resetButtons) {
        resetButton.onclick = clearNote;
    }
}

function showEditNotes(){
    let parentNode = this.parentNode;
    let popupEl = parentNode.querySelector('.edit-trainer-notes-popup');
    popupEl.style.transform = 'scale(1,1)';
}

function dismissEditNotes() {
    let popupEl = this.parentNode.parentNode.parentNode;
    popupEl.style.transform = 'scale(0,0)';
}

function submitNotes(){
    let popupEl = this.parentNode.parentNode.parentNode.parentNode.parentNode;
    popupEl.style.transform = 'scale(0,0)';

    let parentEl = popupEl.parentNode;
    let displayEl = parentEl.querySelector('.trainer-notes-display');
    let form = this.parentNode.parentNode;
    let newNote = getChildByClassName(form, 'notes').value;
    displayEl.innerText = newNote;
    let addNotesButton = parentEl.querySelector('.edit-trainer-notes-button');
    if (newNote != '') {
        addNotesButton.innerHTML = '<i class="far fa-edit"></i> Edit your notes';
    } else {
        addNotesButton.innerHTML = 'Add trainer notes';
    }
}

/**
 * Clears the input textfield for the note. It does not save the changes.
 */
function clearNote(){
    let form = this.parentNode.parentNode;
    let inputEl = form.querySelector('.notes');
    inputEl.value = "";
}

/**
 * and here we go
 */
window.onload = function () {
    initiateSortable();
    initiateWordcloudFilter();
    initiateEditTitle();
    initiateTimeBreaks();
    initiateTrashButton();
    initiateTimeEdit();
    initiateMobileButtons();
    calculateTime();
    calculateSummary();
    initiateAuthorListToggleButton();
    initiateEditNotes();
}