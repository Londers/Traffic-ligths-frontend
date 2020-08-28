let ws;
let regionInfo = [];
let areaInfo = [];
let saveShit = [];
let multiples = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30];

let swSum = true;
let rlSum = true;
let swSwitch = true;
let rlSwitch = true;
let changeFlag = false;

function sortByPlace(a, b) {
    return (a.region !== b.region) ? (a.region - b.region) : (a.area !== b.area) ? (a.area - b.area) : (a.subarea - b.subarea);
}

function checkIfChecked(selected, table, txt) {
    $('#updateMsg' + table).remove();
    if (selected === undefined) {
        $('#' + table).parent().parent().prepend('<div style="color: red;" id="updateMsg' + table + '"><h5>Выберите ' + txt + '</h5></div>');
        return false;
    }
    return true;
}

function findInSave(selected) {
    let ret = {};
    saveShit.forEach(save => {
        if ((save.region === selected.region) && (save.area === selected.area) && (save.subarea === selected.subarea)) {
            ret = save;
        }
    });
    return ret;
}

function createCharPoint() {
    let charPoint = {
        region: Number($('#region').find(':selected').text()),
        area: Number($('#area').find(':selected').text()),
        subarea: Number($('#subarea').val()),
        switch: false,
        release: false,
        step: Number($('#step').find(':selected').text()),
        rem: Number($('#step').find(':selected').text()),
        ltime: (changeFlag) ? findInSave($('#table').bootstrapTable('getSelections')[0]).ltime : new Date(0).toISOString(),
        pkcalc: 0,
        pklast: 0,
        pknow: 0,
        status: [],
        left: parseFloat($('#left').val()),
        right: parseFloat($('#right').val()),
        Strategys: $('#strategyTable').bootstrapTable('getData'),
        Calculates: $('#calcTable').bootstrapTable('getData'),
        Results: []
    };
    charPoint.Strategys.forEach(strategy => {
        delete strategy.state;
    });
    charPoint.Calculates.forEach(calc => {
        calc.chanL = calc.chanL.trim().split(',').map(Number);
        calc.chanR = calc.chanR.trim().split(',').map(Number);
        delete calc.state;
    });
    // console.log(charPoint);
    ws.send(JSON.stringify({
        type: (changeFlag) ? 'xctrlChange' : 'xctrlCreate',
        state: (changeFlag) ? [charPoint] : charPoint
    }));
}

function checkRange(xleft, xright) {
    let left = Number($('#' + xleft).val());
    let right = Number($('#' + xright).val());
    if (left >= right) {
        $('#' + xright).parent().append('<div style="color: red;" id="invalid' + xright + '"><h5>Правая граница должна быть больше левой</h5></div>');
        return false;
    }
    return true;
}

function checkCoincidence(region, area, subarea) {
    let ret = true;
    saveShit.forEach(save => {
        if ((save.region === region) && (save.area === area) && (save.subarea === subarea)) {
            $('#subarea').parent().append('<div style="color: red;" id="invalidsubarea"><h5>Подрайон занят</h5></div>');
            ret = false;
        }
    });
    return ret;
}

function fillStrategyTable(selected) {
    $('#strategyTable').bootstrapTable('removeAll');
    let save = findInSave(selected);
    save.Strategys.forEach(strategy => {
        $('#strategyTable').bootstrapTable('append', {
            xleft: strategy.xleft, xright: strategy.xright, pkl: strategy.pkl,
            pks: strategy.pks, pkr: strategy.pkr
        });
    })

}

function fillCalcTable(selected) {
    $('#calcTable').bootstrapTable('removeAll');
    let save = findInSave(selected);
    save.Calculates.forEach(calculate => {
        $('#calcTable').bootstrapTable('append', {
            region: calculate.region,
            area: calculate.area,
            id: calculate.id,
            chanL: calculate.chanL.toString(),
            chanR: calculate.chanR.toString()
        });
    })
}

$(function () {
    multiples.forEach(number => {
        $('#step').append(new Option(Number(number), Number(number)));
    });

    let $table = $('#table');

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
        let dataArr = [];

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
                    row.data = makeDataCol(row.ltime, row.pkcalc, row.pknow, row.pklast);
                    row.attitude = makeAttitudeCol(row.left, row.right);
                    statusCB = '-';
                });
                $table.bootstrapTable('load', data.xctrlInfo);
                saveShit = data.xctrlInfo;
                dataArr = $table.bootstrapTable('getData');
                buildTable();
                fillAreas();

                swSwitch = swSum;
                rlSwitch = !rlSum;
                break;
            case 'xctrlReInfo':
                data.xctrlInfo.sort(sortByPlace);
                data.xctrlInfo.forEach(row => {
                    row.data = makeDataCol(row.ltime, row.pkcalc, row.pknow, row.pklast);
                    row.attitude = makeAttitudeCol(row.left, row.right);
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
                    newRow.data = makeDataCol(newRow.ltime, newRow.pkcalc, newRow.pknow, newRow.pklast);
                    newRow.attitude = makeAttitudeCol(newRow.left, newRow.right);
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
            $(checkBox).prop('checked', !swSum);
        });
        massControl();
    });

    $('#releaseCheck').on('change', function () {
        let sum = true;
        $('#table tbody').find('input[id*="rl"]').each((i, checkBox) => {
            let swValue = $('#sw' + i)[0].checked;
            sum = sum && !swValue;
            $(checkBox).prop('checked', rlSwitch ? swValue : false);
        });
        if (!sum) rlSwitch = !rlSwitch;
        massControl();
    });

    $('#region').on('change', function () {
        fillAreas();
    });

    $('#appendButton').on('click', function () {
        changeFlag = false;
        $('#subarea').val('');
        $('#left').val('');
        $('#right').val('');
        $('#strategyTable').bootstrapTable('removeAll');
        $('#calcTable').bootstrapTable('removeAll');
        $('#addDialog1').dialog('open');
    });

    $('#updateButton').on('click', function () {
        let selected = $('#table').bootstrapTable('getSelections')[0];
        if (!checkIfChecked(selected, 'table', 'характерную точку')) return;
        changeFlag = true;
        $('#region')[0].value = selected.region;
        $('#area')[0].value = selected.area;
        $('#subarea').val(selected.subarea);
        $('#step')[0].value = selected.step;
        $('#left').val(selected.left);
        $('#right').val(selected.right);
        $('#addDialog1').dialog('open');
    });

    $('#deleteButton').on('click', function () {
        let selected = $('#table').bootstrapTable('getSelections')[0];
        if (!checkIfChecked(selected, 'table', 'характерную точку')) return;
        ws.send(JSON.stringify({
            type: 'xctrlDelete',
            region: Number(selected.region),
            area: Number(selected.area),
            subarea: Number(selected.subarea)
        }));
        // $('#table').bootstrapTable('remove', {field: 'state', values: [true]});
    });

    //Всплывающее окно для изменения пользователя
    $('#addDialog1').dialog({
        autoOpen: false,
        buttons: {
            'Далее': function () {
                if (validateInput('subarea') & validateInput('left') & validateInput('right')) {
                    if (changeFlag) {
                        let selected = $('#table').bootstrapTable('getSelections')[0];
                        if (!((selected.region == $('#region').find(':selected').text()) &&
                            (selected.area == $('#area').find(':selected').text()) &&
                            (selected.subarea == $('#subarea').val()))) {
                            if (checkCoincidence(Number($('#region').find(':selected').text()),
                                Number($('#area').find(':selected').text()),
                                Number($('#subarea').val()))) {
                                fillStrategyTable(selected);
                                $('#addDialog2').dialog('open');
                                $(this).dialog('close');
                            }
                        } else {
                            fillStrategyTable(selected);
                            $('#addDialog2').dialog('open');
                            $(this).dialog('close');
                        }
                    } else if (checkCoincidence(Number($('#region').find(':selected').text()),
                        Number($('#area').find(':selected').text()),
                        Number($('#subarea').val()))) {
                        $('#addDialog2').dialog('open');
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
                    if (changeFlag) fillCalcTable($('#table').bootstrapTable('getSelections')[0]);
                    $('#addDialog3').dialog('open');
                    $(this).dialog('close');
                }
            },
            'Назад': function () {
                $('#addDialog1').dialog('open');
                $(this).dialog('close');
            }
        },
        minWidth: 1000,
        modal: true,
        resizable: false
    });

    $('#appendButton2').on('click', function () {
        $('#xleft').val('');
        $('#xright').val('');
        $('#pkl').val('');
        $('#pks').val('');
        $('#pkr').val('');
        $('#addStrategyDialog').dialog('open');
    });

    $('#updateButton2').on('click', function () {
        let selected = $('#strategyTable').bootstrapTable('getSelections')[0];
        if (!checkIfChecked(selected, 'strategyTable', 'стратегию')) return;
        $('#updateXleft').val(selected.xleft);
        $('#updateXright').val(selected.xright);
        $('#updatePkl').val(selected.pkl);
        $('#updatePks').val(selected.pks);
        $('#updatePkr').val(selected.pkr);
        $('#updateStrategyDialog').dialog('open');
    });

    $('#deleteButton2').on('click', function () {
        $('#strategyTable').bootstrapTable('remove', {field: 'state', values: [true]});
    });

    $('#addStrategyDialog').dialog({
        autoOpen: false,
        buttons: {
            'Создать': function () {
                if (validateInput('xleft') & validateInput('xright') & validateInput('pkl')
                    & validateInput('pks') & validateInput('pkr')) {
                    if (checkRange('xleft', 'xright')) {
                        $('#strategyTable').bootstrapTable('append', {
                            xleft: Number($('#xleft').val()),
                            xright: Number($('#xright').val()),
                            pkl: Number($('#pkl').val()),
                            pks: Number($('#pks').val()),
                            pkr: Number($('#pkr').val())
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
                if (validateInput('updateXleft') & validateInput('updateXright') & validateInput('updatePkl')
                    & validateInput('updatePks') & validateInput('updatePkr')) {
                    if (checkRange('updateXleft', 'updateXright')) {
                        $('#strategyTable').bootstrapTable('updateRow', {
                            index: target,
                            row: {
                                xleft: Number($('#updateXleft').val()),
                                xright: Number($('#updateXright').val()),
                                pkl: Number($('#updatePkl').val()),
                                pks: Number($('#updatePks').val()),
                                pkr: Number($('#updatePkr').val())
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
        minWidth: 1200,
        modal: true,
        resizable: false
    });


    $('#appendButton3').on('click', function () {
        $('#id').val('');
        $('#chanL').val('');
        $('#chanR').val('');
        $('#addCalcDialog').dialog('open');
    });

    $('#updateButton3').on('click', function () {
        let selected = $('#calcTable').bootstrapTable('getSelections')[0];
        if (!checkIfChecked(selected, 'calcTable', 'расчёт')) return;
        $('#updateId').val(selected.id);
        $('#updateChanL').val(selected.chanL.toString());
        $('#updateChanR').val(selected.chanR.toString());
        $('#updateCalcDialog').dialog('open');
    });

    $('#deleteButton3').on('click', function () {
        $('#calcTable').bootstrapTable('remove', {field: 'state', values: [true]});
    });

    $('#addCalcDialog').dialog({
        autoOpen: false,
        buttons: {
            'Создать': function () {
                if ((validateInput('chanL') & validateInput('chanR'))) {
                    $('#calcTable').bootstrapTable('append', {
                        region: Number($('#region').find(':selected').text()),
                        area: Number($('#area2').find(':selected').text()),
                        id: Number($('#id').val()),
                        chanL: $('#chanL').val(),
                        chanR: $('#chanR').val()
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
                if (validateInput('updateChanL') & validateInput('updateChanR')) {
                    $('#calcTable').bootstrapTable('updateRow', {
                        index: target,
                        row: {
                            region: Number($('#region').find(':selected').text()),
                            area: Number($('#area').find(':selected').text()),
                            id: Number($('#updateId').val()),
                            chanL: $('#updateChanL').val(),
                            chanR: $('#updateChanR').val()
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
    swSum = rlSum = true;
    $('#table').find('tr').find('td').each((i, td) => {
        let value = td.innerText;
        let rowIndex = td.parentElement.rowIndex - 1;

        // $('#rl' + rowIndex)[0].checked;

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
        if (td.cellIndex === 8) {
            td.innerText = '';
            buildCheckbox(td, 'st', rowIndex);
        }
        if (td.cellIndex === 10) {
            td.innerText = '';
            buildCheckbox(td, 'rs', rowIndex);
        }
    });
}

function buildCheckbox(td, id, rowIndex) {
    // $(td).css('style', 'max-width: 100px; max-height: 100px');
    if (id === 'st') {
        $(td).append('<div class="custom-control custom-checkbox popup">\n' +
            '<input type="checkbox" class="custom-control-input"style="position: relative; z-index: 0"  id="' + id + rowIndex + '">\n' +
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
    } else if (id === 'rs') {
        $(td).append('<div class="custom-control custom-checkbox popup">\n' +
            '<input type="checkbox" class="custom-control-input" id="' + id + rowIndex + '">\n' +
            '<label class="custom-control-label" for="' + id + rowIndex + '"></label>' +
            '<div class="popuptext" id="result' + rowIndex + '"></div></div>')
            .on('change', () => {
                $('#result' + rowIndex)[0].classList.toggle("show");
                $('#result' + rowIndex)[0].innerHTML = '';
                saveShit[rowIndex].Results.forEach(result => {
                    $('#result' + rowIndex)[0].innerHTML += 'Интенсивность прямого направления ' + result.il
                        + ', Интенсивность обратного направления ' + result.ir + ', отношение: ' + Number((result.il / result.ir).toFixed(2)) + '<br>';
                });
            })
    } else {
        $(td).append('<div class="custom-control custom-checkbox">\n' +
            '<input type="checkbox" class="custom-control-input" id="' + id + rowIndex + '">\n'
            + '<label class="custom-control-label" for="' + id + rowIndex + '"></label></div>'
        )
            .on('change', () => {
                if (id === 'rl') {
                    if (!$('#sw' + rowIndex)[0].checked) {
                        $('#rl' + rowIndex)[0].checked = false;
                        return;
                    }
                } else if (id === 'sw') {
                    if (!$('#sw' + rowIndex)[0].checked) {
                        $('#rl' + rowIndex)[0].checked = false;
                        // return;
                    }
                }
                let toSend = saveShit[rowIndex];
                toSend.switch = $('#sw' + rowIndex)[0].checked;
                toSend.release = $('#rl' + rowIndex)[0].checked;
                ws.send(JSON.stringify({type: 'xctrlChange', state: [toSend]}));
                // console.log('rowIndex ' + rowIndex + ', checkbox ' + id + ' was changed to ' + $('#' + id + rowIndex)[0].checked);
            });
        let value = false;
        if (id === 'sw') {
            value = saveShit[rowIndex].switch;
            swSum = swSum && value;
        }
        if (id === 'rl') {
            value = saveShit[rowIndex].release;
            rlSum = rlSum && value;
        }
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

function makeDataCol(ltime, pkcalc, pknow, pklast) {
    return 'Время: ' + timeFormat(ltime) +
        ', рассчитанный ПК: ' + ((pkcalc === 0) ? 'нет' : pkcalc) +
        ', текущий ПК: ' + ((pknow === 0) ? 'нет' : pknow) +
        ', предыдущий ПК: ' + ((pklast === 0) ? 'нет' : pklast);
}

function makeAttitudeCol(left, right) {
    return 'Для прямого направления: ' + left + ', для обратного направления: ' + right;
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