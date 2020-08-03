let ws;
let saveShit = [];
let multiples = [1, 2, 3, 4, 5, 10, 15, 20, 30];

/**
 * @return {number}
 */
function sortByPlace(a, b) {
    let aName = Number('' + a.region + a.area + a.subarea);
    let bName = Number('' + b.region + b.area + b.subarea);
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

$(function () {
    let $table = $('#table');
    $table.bootstrapTable('hideColumn', 'ltime')
        .bootstrapTable('hideColumn', 'pknow')
        .bootstrapTable('hideColumn', 'pklast')
        .bootstrapTable('hideColumn', 'xnum')
        .bootstrapTable('hideColumn', 'status');

    ws = new WebSocket('ws://' + location.host + location.pathname + 'W');
    ws.onopen = function () {
        console.log('connected');
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
    };

    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        // let switchFlag = true;
        let dataArr = [];

        // let counter = 0;
        switch (allData.type) {
            case 'xctrlInfo':
                data.xctrlInfo.sort(sortByPlace);
                data.xctrlInfo.forEach(row => {
                    row.data = makeShit(row.ltime, row.pknow, row.pklast, row.xnum, row.status);
                });
                $table.bootstrapTable('load', data.xctrlInfo);
                saveShit = data.xctrlInfo;
                dataArr = $table.bootstrapTable('getData');
                buildTable();
                break;
            case 'xctrlUpdate':
                let index = -1;
                dataArr = $table.bootstrapTable('getData');
                data.xctrlUpdate.forEach(newRow => {
                    dataArr.forEach(function (row, i) {
                        if ((newRow.region === row.region) && (newRow.area === row.area) && (newRow.subarea === row.subarea)) {
                            index = i;
                        }
                    });
                    newRow.data = makeShit(newRow.ltime, newRow.pknow, newRow.pklast, newRow.xnum, newRow.status);
                    $table.bootstrapTable('updateRow', {index: index, row: newRow});
                    saveShit[index] = newRow;
                });
                buildTable();
                break;
            case 'close':
                ws.close();
                if (data.message !== '') {
                    alert(data.message);
                } else {
                    alert('Потеряна связь с сервером');
                }
                window.close();
                break;
            case 'error':
                console.log('error', evt);
                break;
        }
    };

    ws.onerror = function (evt) {
        console.log('WebsSocket error:' + evt);
    };

    $('#switchCheck').on('change', function () {
        $('#table tbody').find('input[id*="sw"]').each((i, checkBox) => {
            $(checkBox).prop('checked', $('#switchCheck')[0].checked);
        });
        massControl();
    });

    $('#releaseCheck').on('change', function () {
        $('#table tbody').find('input[id*="rl"]').each((i, checkBox) => {
            $(checkBox).prop('checked', $('#releaseCheck')[0].checked);
        });
        massControl();
    });
});

function massControl() {
    let toSend = [];
    saveShit.forEach((row, index) => {
        row.switch = $('#sw' + index)[0].checked;
        row.release = $('#rl' + index)[0].checked;
        toSend.push(row);
    });
    ws.send(JSON.stringify({type: 'xctrlChange', state: toSend}));
}

function buildTimeSelect(td, rowIndex, value) {
    let ret = '';
    let id = 'timeSelect' + rowIndex;
    ret = '<div class="form-group">\n' +
        '<label for="' + id + '" class="mr-2"></label>\n' +
        '<select id="' + id + '">\n' +
        '</select>\n' +
        '</div>';
    $(td).append(ret);
    multiples.forEach(number => {
       $('#' + id).append(new Option(Number(number), Number(number)));
    });
    $('#' + id).val(value);
}

function buildTable() {
    let switchFlag = true;
    $('#table').find('tr').find('td').each((i, td) => {
        let value = td.innerText;
        let rowIndex = td.parentElement.rowIndex - 1;
        if ((value === 'true') || (value === 'false')) {
            td.innerText = '';
            if (switchFlag) {
                buildCheckbox(td, 'sw', rowIndex);
            } else {
                buildCheckbox(td, 'rl', rowIndex);
            }
            switchFlag = !switchFlag;
        }
        if (td.cellIndex === 3) {
            td.innerText = '';
            buildTimeSelect(td, rowIndex, value);
        }
        if (value === '-') {
            td.innerText = '';
            buildCheckbox(td, 'st', rowIndex);
        }
    });
}

function buildCheckbox(td, id, rowIndex) {
    $(td).append('<div class="custom-control custom-checkbox">\n' +
        '<input type="checkbox" class="custom-control-input" id="' + id + rowIndex + '">\n' +
        '<label class="custom-control-label" for="' + id + rowIndex + '"></label></div>')
        .on('change', () => {
            let toSend = saveShit[rowIndex];
            toSend.switch = $('#sw' + rowIndex)[0].checked;
            toSend.release = $('#rl' + rowIndex)[0].checked;
            ws.send(JSON.stringify({type: 'xctrlChange', state: [toSend]}));
            console.log('rowIndex ' + rowIndex + ', checkbox ' + id + ' was changed to ' + $('#' + id + rowIndex)[0].checked);
        });
    let value = false;
    if (id === 'sw') value = saveShit[rowIndex].switch;
    if (id === 'rl') value = saveShit[rowIndex].release;
    $('#' + id + rowIndex)[0].checked = value;
}

function timeFormat(time) {
    let date = new Date(time);
    // date = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
    const dateTimeFormat = new Intl.DateTimeFormat('ru', {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
    // console.log(date);
    return dateTimeFormat.format(date);
}

function makeShit(ltime, pknow, pklast, xnum, status) {
    let ret = 'Время: ' + timeFormat(ltime) +
        ',Предыдущий ПК: ' + ((pklast === 0) ? 'нет' : pklast) + ', новый ПК: ' + ((pknow === 0) ? 'нет' : pknow) +
        ',Характерное число: ' + xnum;
    return ret;
}