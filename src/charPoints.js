let ws;
let regionInfo = [];
let areaInfo = [];
let saveShit = [];
let multiples = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30];

/**
 * @return {number}
 */
function sortByPlace(a, b) {
    let aName = Number('' + a.region + a.area + a.subarea);
    let bName = Number('' + b.region + b.area + b.subarea);
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}//TODO сортировка говно

function createCharPoint() {
    let charPoint = {
        region: Number($('#region').find(':selected').text()),
        area: Number($('#area').find(':selected').text()),
        subarea: Number($('#subarea').val()),
        switch: false,
        release: false,
        step: Number($('#step').find(':selected').text()),
        rem: Number($('#step').find(':selected').text()),
        ltime: new Date(0).toISOString(),
        pknow: 0,
        pklast: 0,
        xnum: 0,
        status: [],
        Strategys: $('#strategyTable').bootstrapTable('getData'),
        Calculates: $('#calcTable').bootstrapTable('getData')
    };
    charPoint.Strategys.forEach(strategy => {
        delete strategy.state;
    });
    charPoint.Calculates.forEach(calc => {
        delete calc.state;
    });
    // console.log(charPoint);
    ws.send(JSON.stringify({type: 'xctrlCreate', state: charPoint}));
}

function checkRange(xleft, xright) {
    let left = Number($('#' + xleft).val());
    let right = Number($('#' + xright).val());
    if (left >= right) {
        $('#' + xright).parent().append('<div style="color: red;" id="invalid' + xright + '"><h5>Правая граница должна быть больше левой</h5></div>');;
        return false;
    }
    return true;
}

$(function () {
    multiples.forEach(number => {
        $('#step').append(new Option(Number(number), Number(number)));
    });

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
                regionInfo = data.regionInfo;
                areaInfo = data.areaInfo;

                let keys = Object.keys(regionInfo);
                keys.forEach(key => {
                    $('#region').append(new Option(key, key));
                });

                data.xctrlInfo.sort(sortByPlace);
                data.xctrlInfo.forEach(row => {
                    row.data = makeDataCol(row.ltime, row.pknow, row.pklast, row.xnum);
                    statusCB = '-';
                });
                $table.bootstrapTable('load', data.xctrlInfo);
                saveShit = data.xctrlInfo;
                dataArr = $table.bootstrapTable('getData');
                buildTable();
                fillAreas();
                break;
            case 'xctrlReInfo':
                data.xctrlInfo.sort(sortByPlace);
                data.xctrlInfo.forEach(row => {
                    row.data = makeDataCol(row.ltime, row.pknow, row.pklast, row.xnum);
                    statusCB = '-';
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
                    newRow.data = makeDataCol(newRow.ltime, newRow.pknow, newRow.pklast, newRow.xnum);
                    $table.bootstrapTable('updateRow', {index: index, row: newRow});
                    saveShit[index] = newRow;
                });
                buildTable();
                break;
            case 'getArea':
                $('#id').empty();
                data.tflight.forEach(tflight => {
                    $('#id').append(new Option(tflight.ID + ' - ' + tflight.description, tflight.ID));
                });
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
        console.log('WebSocket error:' + evt);
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

    $('#region').on('change', function () {
        fillAreas();
    });

    $('#appendButton').on('click', function () {
        $('#subarea').val('');
        $('#addDialog1').dialog('open');
    });

    //Всплывающее окно для изменения пользователя
    $('#addDialog1').dialog({
        autoOpen: false,
        buttons: {
            'Далее': function () {
                if (validateInput('subarea')) {
                    $('#addDialog2').dialog('open');
                    $(this).dialog('close');
                }
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false
    });

    $('#addDialog2').dialog({
        autoOpen: false,
        buttons: {
            'Далее': function () {
                ws.send(JSON.stringify({
                    type: 'getArea',
                    region: Number($('#region').find(':selected').text()),
                    area: Number($('#area2').find(':selected').text())
                }));
                if (validateTable('strategyTable')) {
                    $('#addDialog3').dialog('open');
                    $(this).dialog('close');
                }
            },
            'Назад': function () {
                $('#addDialog1').dialog('open');
                $(this).dialog('close');
            }
        },
        minWidth: 800,
        modal: true,
        resizable: false
    });

    $('#appendButton2').on('click', function () {
        $('#xleft').val('');
        $('#xright').val('');
        $('#pk').val('');
        $('#addStrategyDialog').dialog('open');
    });

    $('#updateButton2').on('click', function () {
        let selected = $('#strategyTable').bootstrapTable('getSelections')[0];
        $('#updateXleft').val(selected.xleft);
        $('#updateXright').val(selected.xright);
        $('#updatePk').val(selected.pk);
        $('#updateStrategyDialog').dialog('open');
    });

    $('#deleteButton2').on('click', function () {
        $('#strategyTable').bootstrapTable('remove', {field: 'state', values: [true]});
    });

    $('#addStrategyDialog').dialog({
        autoOpen: false,
        buttons: {
            'Создать': function () {
                if (validateInput('xleft') & validateInput('xright') & validateInput('pk')) {
                    if (checkRange('xleft', 'xright')) {
                        $('#strategyTable').bootstrapTable('append', {
                            xleft: Number($('#xleft').val()),
                            xright: Number($('#xright').val()),
                            pk: Number($('#pk').val())
                        });
                        $(this).dialog('close');
                    }
                }
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false
    });

    $('#updateStrategyDialog').dialog({
        autoOpen: false,
        buttons: {
            'Изменить': function () {
                let target = -1;
                $('#strategyTable').find('tr').each((i, tr) => {
                    if (i !== 0) if (tr.cells[0].children[0].children[0].checked) target = i - 1;
                });
                if (validateInput('updateXleft') & validateInput('updateXright') & validateInput('updatePk')) {
                    if (checkRange('updateXleft', 'updateXright')) {
                        $('#strategyTable').bootstrapTable('updateRow', {
                            index: target,
                            row: {
                                xleft: Number($('#updateXleft').val()),
                                xright: Number($('#updateXright').val()),
                                pk: Number($('#updatePk').val())
                            }
                        });
                        $(this).dialog('close');
                    }
                }
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false
    });

    $('#addDialog3').dialog({
        autoOpen: false,
        buttons: {
            'Создать': function () {
                if (validateTable('calcTable')) {
                    createCharPoint();
                    $('#strategyTable').bootstrapTable('removeAll');
                    $('#calcTable').bootstrapTable('removeAll');
                    $(this).dialog('close');
                }
            },
            'Назад': function () {
                $('#addDialog2').dialog('open');
                $(this).dialog('close');
            }
        },
        minWidth: 800,
        modal: true,
        resizable: false
    });


    $('#appendButton3').on('click', function () {
        $('#id').val('');
        $('#chan').val('');
        $('#mult').val('');
        $('#addCalcDialog').dialog('open');
    });

    $('#updateButton3').on('click', function () {
        let selected = $('#calcTable').bootstrapTable('getSelections')[0];
        $('#updateId').val(selected.id);
        $('#updateChan').val(selected.chan);
        $('#updateMult').val(selected.mult);
        $('#updateCalcDialog').dialog('open');
    });

    $('#deleteButton3').on('click', function () {
        $('#calcTable').bootstrapTable('remove', {field: 'state', values: [true]});
    });

    $('#addCalcDialog').dialog({
        autoOpen: false,
        buttons: {
            'Создать': function () {
                if (validateInput('chan') & validateInput('mult')) {
                    $('#calcTable').bootstrapTable('append', {
                        region: Number($('#region').find(':selected').text()),
                        area: Number($('#area2').find(':selected').text()),
                        id: Number($('#id').val()),
                        chan: Number($('#chan').val()),
                        mult: Number($('#mult').val())
                    });
                    $(this).dialog('close');
                }
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false
    });

    $('#updateCalcDialog').dialog({
        autoOpen: false,
        buttons: {
            'Изменить': function () {
                let target = -1;
                $('#calcTable').find('tr').each((i, tr) => {
                    if (i !== 0) if (tr.cells[0].children[0].children[0].checked) target = i - 1;
                });
                if (validateInput('updateChan') & validateInput('updateMult')) {
                    $('#calcTable').bootstrapTable('updateRow', {
                        index: target,
                        row: {
                            region: Number($('#region').find(':selected').text()),
                            area: Number($('#area').find(':selected').text()),
                            id: Number($('#updateId').val()),
                            chan: Number($('#updateChan').val()),
                            mult: Number($('#updateMult').val())
                        }
                    });
                    $(this).dialog('close');
                }
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false
    });

    $('#area2').on('change', function () {
        ws.send(JSON.stringify({
            type: 'getArea',
            region: Number($('#region').find(':selected').text()),
            area: Number($('#area2').find(':selected').text())
        }));
    })
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
    $('#' + id).val(value).on('change', function () {
        let toSend = saveShit[$(this)[0].parentElement.parentElement.parentElement.rowIndex - 1];
        toSend.step = Number($(this)[0].value);
        toSend.rem = Number($(this)[0].value);
        ws.send(JSON.stringify({type: 'xctrlChange', state: [toSend]}));
        // console.log($(this)[0].parentElement.parentElement.parentElement.rowIndex + $(this)[0].value);
    });
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
        if (td.cellIndex === 4) {
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
    if (id === 'st') {
        $(td).append('<div class="custom-control custom-checkbox popup">\n' +
            '<input type="checkbox" class="custom-control-input" id="' + id + rowIndex + '">\n' +
            '<label class="custom-control-label" for="' + id + rowIndex + '"></label>' +
            '<div class="popuptext" id="status' + rowIndex + '"></div></div>')
            .on('change', () => {
                $('#status' + rowIndex)[0].classList.toggle("show");
                $('#status' + rowIndex)[0].innerHTML = '';
                saveShit[rowIndex].status.forEach(status => {
                    $('#status' + rowIndex)[0].innerHTML += status + '<br>';
                });

                // let toSend = saveShit[rowIndex];
                // toSend.switch = $('#sw' + rowIndex)[0].checked;
                // toSend.release = $('#rl' + rowIndex)[0].checked;
                // ws.send(JSON.stringify({type: 'xctrlChange', state: [toSend]}));
                // console.log('rowIndex ' + rowIndex + ', checkbox ' + id + ' was changed to ' + $('#' + id + rowIndex)[0].checked);
            })
        // $('#status' + rowIndex).append(
        // '<table class="table table-bordered text-center" id="statusTable'+rowIndex+'" data-toggle="table"' +
        // '       data-toolbar="#toolbar'+rowIndex+'" data-single-select="true" data-click-to-select="true" cellspacing="0"' +
        // '       data-height="900">' +
        // '    <thead>' +
        // '    <tr style="">' +
        // '        <th data-field="status">-</th>' +
        // '    </tr>' +
        // '    </thead>' +
        // '    <tbody style="">' +
        // '    </tbody>' +
        // '</table>'
        // );
    } else {
        $(td).append('<div class="custom-control custom-checkbox">\n' +
            '<input type="checkbox" class="custom-control-input" id="' + id + rowIndex + '">\n' +
            '<label class="custom-control-label" for="' + id + rowIndex + '"></label></div>')
            .on('change', () => {
                let toSend = saveShit[rowIndex];
                toSend.switch = $('#sw' + rowIndex)[0].checked;
                toSend.release = $('#rl' + rowIndex)[0].checked;
                ws.send(JSON.stringify({type: 'xctrlChange', state: [toSend]}));
                // console.log('rowIndex ' + rowIndex + ', checkbox ' + id + ' was changed to ' + $('#' + id + rowIndex)[0].checked);
            });
        let value = false;
        if (id === 'sw') value = saveShit[rowIndex].switch;
        if (id === 'rl') value = saveShit[rowIndex].release;
        $('#' + id + rowIndex)[0].checked = value;
        // if (id === 'st') {
        //     $('#' + id + rowIndex)[0].className = $('#' + id + rowIndex)[0].className.toString() + ' popup';
        //     $(td).append('<span class="popuptext" id="myPopup' + rowIndex + '">A Simple Popup!</span>');
        //     $('#' + id + rowIndex).on('click', myFunction(rowIndex));
        // }
    }
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

function makeDataCol(ltime, pknow, pklast, xnum) {
    let ret = 'Время: ' + timeFormat(ltime) +
        ',Предыдущий ПК: ' + ((pklast === 0) ? 'нет' : pklast) + ', новый ПК: ' + ((pknow === 0) ? 'нет' : pknow) +
        ',Характерное число: ' + xnum;
    return ret;
}


//Заполнение поля выбора районов для создания или изменения пользователя
function fillAreas() {
    $('#area').empty();
    $('#area2').empty();
    for (let regAreaJson in areaInfo) {
        for (let areaJson in areaInfo[regAreaJson]) {
            if (regAreaJson === regionInfo[$('#region').find(':selected').text()]) {
                $('#area').append(new Option(areaJson, areaJson));
                $('#area2').append(new Option(areaJson, areaJson));
            }
        }
    }
}

function validateInput(id) {
    $('#invalid' + id).remove();
    if ($('#' + id)[0].value.length === 0) {
        $('#' + id).parent().append('<div style="color: red;" id="invalid' + id + '"><h5>Пожалуйста, заполните поле</h5></div>');
        return false;
    }
    return true;
}

function validateTable(id) {
    $('#invalid' + id).remove();
    if ($('#' + id).bootstrapTable('getData').length === 0) {
        $('#' + id).parent().parent().prepend('<div style="color: red;" id="invalid' + id + '"><h5>Пожалуйста, заполните таблицу</h5></div>');
        return false;
    }
    return true;
}