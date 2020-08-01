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

    let ws = new WebSocket('ws://' + location.host + location.pathname + 'W');
    ws.onopen = function () {
        console.log('connected');
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
    };


    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        let switchFlag = true;
        let dataArr = [];
        let counter = 0;
        switch (allData.type) {
            case 'xctrlInfo':
                data.xctrlInfo.sort(sortByPlace);
                $table.bootstrapTable('load', data.xctrlInfo);
                dataArr = $table.bootstrapTable('getData');
                dataArr.forEach(rec => {
                    $table.bootstrapTable('updateCell', {
                        index: counter++,
                        field: 'data',
                        value: makeShit(rec.ltime, rec.pknow, rec.pklast, rec.xnum, rec.status)
                    });
                });
                switchFlag = true;
                $table.find('tr').find('td').each((i, td) => {
                    let value = $(td)[0].innerText;
                    let row = $(td)[0].parentElement.rowIndex - 1;
                    if ((value === 'true') || (value === 'false')) {
                        $(td)[0].innerText = '';
                        if (switchFlag) {
                            buildCheckBox(td, 'sw', row);
                        } else {
                            buildCheckBox(td, 'rl', row);
                        }
                        switchFlag = !switchFlag;
                    }
                    if (value === '-') {
                        $(td)[0].innerText = '';
                        buildCheckBox(td, 'st', row);
                    }
                });
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
                    $table.bootstrapTable('updateRow', {index: index, row: newRow});
                });
                dataArr.forEach(rec => {
                    $table.bootstrapTable('updateCell', {
                        index: counter++,
                        field: 'data',
                        value: makeShit(rec.ltime, rec.pknow, rec.pklast, rec.xnum, rec.status)
                    });
                });
                switchFlag = true;
                $table.find('tr').find('td').each((i, td) => {
                    let value = $(td)[0].innerText;
                    let row = $(td)[0].parentElement.rowIndex - 1;
                    if ((value === 'true') || (value === 'false')) {
                        $(td)[0].innerText = '';
                        if (switchFlag) {
                            buildCheckBox(td, 'sw', row);
                        } else {
                            buildCheckBox(td, 'rl', row);
                        }
                        switchFlag = !switchFlag;
                    }
                    if (value === '-') {
                        $(td)[0].innerText = '';
                        buildCheckBox(td, 'st', row);
                    }
                });
                break;
            case 'shit2':
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
    });

    $('#releaseCheck').on('change', function () {
        $('#table tbody').find('input[id*="rl"]').each((i, checkBox) => {
            $(checkBox).prop('checked', $('#releaseCheck')[0].checked);
        });
    });

    $('#table').on('click', function () {
        ws.send(JSON.stringify({type: 'xctrlGet'}));
    })
});

function buildCheckBox(td, id, row) {
    $(td).append('<div class="custom-control custom-checkbox">\n' +
        '<input type="checkbox" class="custom-control-input" id="' + id + row + '">\n' +
        '<label class="custom-control-label" for="' + id + row + '"></label></div>')
        .on('change', () => {
            console.log('row ' + row + ', checkbox ' + id + ' was changed to ' + $('#' + id + row)[0].checked);
        })
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
    let ret = 'Время последней операции: ' + timeFormat(ltime) +
        '\nПредыдущий ПК: ' + pklast + ', текущий ПК:' + pknow +
        '\nХарактерное число: ' + xnum;
    return ret;
}