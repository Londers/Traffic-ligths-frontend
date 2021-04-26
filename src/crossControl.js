'use strict';

let data;
let unmodifiedData;
let setDK;
let daySets;
let weekSets;
let monthSets;
let stageSets;
let zoom;
let pkFlag = true;
let skFlag = true;
let kvFlag = true;
let firstLoad = true;

let map;

let coordinatesChangeFlag = false;

const mainTableFlag = true;
const skTableFlag = true;
const nkTableFlag = false;
const gkTableFlag = false;
const vvTableFlag = false;
const vv2TableFlag = true;
const kvTableFlag = false;

// let tempIndex;
// let copyPk = [];
// let copySk = [];
// let copyNk = [];
// let copyGk = [];
let points = {
    Y: 0,
    X: 0
};

let editFlag = false;
let ws;

// Получение информации из выбранной строки
function getSelectedRowData(table, fullPath, force) {
    let index = (force === undefined) ? $('#' + table).find('tr.success').data('index') : force;
    // if (force === undefined) tempIndex = index;
    let path = (fullPath !== undefined) ? fullPath.split('.') : undefined;
    let rowData = [];
    if (index === undefined) return;
    if (table === 'pkTable') {
        let selected = $('#pkSelect').val();
        rowData = JSON.parse(JSON.stringify(setDK[selected][path[0]][index]));
    }
    if (table === 'skTable') {
        let selected = $('#mapNum').val();
        rowData = JSON.parse(JSON.stringify(daySets[selected][path[0]][index]));
    }
    if (table === 'nkTable') {
        rowData = JSON.parse(JSON.stringify(weekSets[index][path[0]]));
    }
    if (table === 'gkTable') {
        rowData = JSON.parse(JSON.stringify(monthSets[index][path[0]]));
    }
    if (table === 'kvTable') {
        rowData = JSON.parse(JSON.stringify(stageSets[index]));
    }
    return rowData;
}

// Выделение выбранной строки
function colorizeSelectedRow(table) {
    let index = $('#' + table).find('tr.success').data('index');

    $('#' + table).find('tbody').find('tr').each(function (counter) {
        $(this).find('td').each(function () {
            $(this).attr('style', (counter === index) ? 'background-color: #cccccc' : '')
        })
    });
}

$(() => {

    if (localStorage.getItem('copyArr') == null) {
        localStorage.setItem('copyArr', JSON.stringify({'pk': [], 'sk': [], 'nk': [], 'gk': [], 'kv': []}));
    }

    ws = new WebSocket('wss://' + location.host + location.pathname + 'W' + location.search);

    ws.onopen = () => {
        console.log('connected');
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
    };

    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        let counter = 0;
        console.log(data);
        switch (allData.type) {
            case 'sendB':
                console.log('sendB');
                if (!data.status) {
                    alert(data.message);
                    return;
                }
                if (localStorage.getItem('login') !== data.user) {
                    loadData(data, false);
                } else {
                    unmodifiedData = JSON.parse(JSON.stringify(data));
                    disableControl('sendButton', false);
                }
                break;
            case 'createB':
                console.log('createB');
                if (!data.status) {
                    alert(data.result.join('\n'))
                } else {
                    location.href = location.pathname + location.search.replace('ID=' + unmodifiedData.state.id, 'ID=' + $('#id').val());
                }
                break;
            case 'controlInfo':
                console.log('controlInfo');
                validatePkArray(data);
                loadData(data, firstLoad);
                document.title = 'АРМ ДК-' + data.state.area + '-' + data.state.id;
                firstLoad = false;
                editFlag = data.edit;
                checkEdit();
                break;
            case 'deleteB':
                // if (Number(data.pos.area) !== unmodifiedData.state.area) {
                //     let search = location.search
                //         .replace('Area=' + unmodifiedData.state.area, 'Area=' + data.pos.area)
                //         .replace('ID=' + unmodifiedData.state.id, 'ID=' + data.pos.id);
                //     location.href = location.pathname + search;
                // } else {
                (data.status) ? window.close() : alert('Не удалось удалить перекрёсток');
                // }
                break;
            case 'checkB': {
                console.log('checkB');
                counter = 0;
                let flag = false;
                if (editFlag) disableControl('sendButton', data.status);
                checkNew(data.status);
                $('#verification').bootstrapTable('removeAll');
                data.result.forEach(function () {
                    if (data.result[counter].includes('Проверка')) {
                        $('#verification').bootstrapTable('append', {
                            left: data.result[counter],
                            right: data.result[counter + 1]
                        });
                        flag = true;
                    } else {
                        (!flag) ? $('#verification').bootstrapTable('append', {
                            left: '',
                            right: data.result[counter]
                        }) : flag = false;
                    }
                    counter++;
                });
                $('#trigger')[0].innerHTML = 'Результат<br>Проверки';
                $('#trigger').show();
                if ($('#panel').attr('style') !== 'display: block;') $('#trigger').trigger('click');
                $('th[data-field="left"]').attr('style', 'min-width: 346px;');
                $('th[data-field="right"]').attr('style', 'min-width: 276px;');
                break;
            }
            case 'changeEdit':
                console.log('changeEdit');
                editFlag = data.edit;
                checkEdit();
                break;
            case 'editInfoB':
                console.log('editInfoB');

                disableControl('sendButton', data.status);
                checkNew(data.status);
                $('#work').bootstrapTable('removeAll');
                data.users.forEach(user => {
                    $('#work').bootstrapTable('append', {
                        wleft: user.user,
                        wright: user.edit ? 'Редактирует' : 'Просматривает'
                    });
                });
                // $('#workTrigger')[0].innerHTML = 'Результат<br>Проверки';
                $('#workTrigger').show();
                if ($('#workPanel').attr('style') !== 'display: block;') $('#workTrigger').trigger('click');
                $('th[data-field="wleft"]').attr('style', 'min-width: 346px;');
                $('th[data-field="wright"]').attr('style', 'min-width: 276px;');

                // $('#trigger')[0].innerHTML = 'Список<br>Пользователей';
                // $('#trigger').show();
                break;
            case 'repaintCheck':
                if (!data.status) {
                    alert(data.message);
                } else {
                    console.log(data.message);
                }
                break;
            case 'close':
                ws.close();
                // if (data.message !== '') {
                //     if (!document.hidden) alert(data.message);
                // } else {
                //     if (!document.hidden) alert('Потеряна связь с сервером');
                // }
                window.close();
                break;
            case 'error':
                console.log('error', evt);
                break;
            default:
                console.log('unknown command', allData.type);
                break;
        }
    };

// Функционал кнопок управления
    // Кнопка для отпрвления данных на сервер
    $('#sendButton').on('click', () => {
        data.state.dgis = points.Y + ',' + points.X;
        prepareVVTab();
        validatePk();
        prepareDaySets();

        if (data.state.area === unmodifiedData.state.area) {
            ws.send(JSON.stringify({type: 'sendB', state: data.state, rePaint: coordinatesChangeFlag, z: zoom}));
        } else {
            ws.send(JSON.stringify({type: 'createB', state: data.state}));
        }

        if ($('#vpcpd').val() === '12.3') {
            let shift4 = data.state.arrays.SetTimeUse.uses.pop();
            let shift3 = data.state.arrays.SetTimeUse.uses.pop();
            data.state.arrays.SetTimeUse.uses.unshift(shift4);
            data.state.arrays.SetTimeUse.uses.unshift(shift3);
            data.state.arrays.SetTimeUse.uses[0].name = '1 ТВП';
            data.state.arrays.SetTimeUse.uses[1].name = '2 ТВП';
        }
    });

    // Заполнение 3х массивов для статистики (defstatis, pointset, useinput)
    function prepareVVTab() {
        let tableData = $('#vvTable').bootstrapTable('getData');
        // true если версия пспд 12.3 и меньше
        let oldVersion = $('#vpcpd').val() === '12.3';
        if (oldVersion) {
            let shift1 = tableData.shift();
            let shift2 = tableData.shift();
            tableData.push(shift1);
            tableData.push(shift2);

            shift1 = data.state.arrays.SetTimeUse.uses.shift();
            shift2 = data.state.arrays.SetTimeUse.uses.shift();
            data.state.arrays.SetTimeUse.uses.push(shift1);
            data.state.arrays.SetTimeUse.uses.push(shift2);
        }

        // defststis
        data.state.arrays.defstatis.lvs[0].count = oldVersion ? 0 : tableData.length;
        data.state.arrays.defstatis.lvs[0].ninput = 0;
        data.state.arrays.defstatis.lvs[0].typst = 0;
        tableData.forEach(enter => {
            if (enter.type !== 0) {
                data.state.arrays.defstatis.lvs[0].typst = 1;
                data.state.arrays.defstatis.lvs[0].ninput++;
            }
        });

        // pointset, useinput
        data.state.arrays.pointset.pts = [];
        data.state.arrays.useinput.used = [];
        tableData.forEach((enter, index) => {

            if (!oldVersion) {
                if (enter.fazes === '0') enter.fazes = '';
                if ((enter.type !== 0) || (enter.tvps !== 0) || (enter.dk !== 0) || (enter.fazes !== '') || (enter.long !== 0)) {
                    data.state.arrays.useinput.used.push(true);
                } else {
                    data.state.arrays.useinput.used.push(false);
                }
            } else {
                if (enter.tvps !== 0) {
                    data.state.arrays.useinput.used.push(true);
                } else {
                    data.state.arrays.useinput.used.push(false);
                }
            }
            if ((enter.type !== 0) && (enter.type < 8)) {
                data.state.arrays.pointset.pts.push({num: index + 1, typst: enter.type});
            } else {
                data.state.arrays.pointset.pts.push({num: 0, typst: 0});
            }
        });


        // let statCount = 0;
        // let shift1 = tableData.shift();
        // let shift2 = tableData.shift();
        // tableData.push(shift1);
        // tableData.push(shift2);
        // 
        // data.state.arrays.useinput.used = [];
        // data.state.arrays.pointset.pts = [];
        // 
        // for (let rec in tableData) {
        //     data.state.arrays.useinput.used.push(false);
        // }
        // for (let i = 0; i < tableData.length; i++) {
        //     if (tableData[i].type !== 0) data.state.arrays.pointset.pts.push({num: i + 1, typst: tableData[i].type});
        // }
        // 
        // tableData.forEach((rec, index) => {
        //     data.state.arrays.useinput.used[index] = (rec.type !== 0);
        //     if ((rec.type !== 0) && (rec.type < 8)) {
        //         data.state.arrays.pointset.pts[index].num = index + 1;
        //         data.state.arrays.pointset.pts[index].typst = rec.type;
        //     }
        //     if (statCount < rec.type) statCount = rec.type;
        // });
        // data.state.arrays.defstatis.lvs[0].typst = statCount;
        // data.state.arrays.defstatis.lvs[0].ninput = tableData.length;
        // data.state.arrays.defstatis.lvs[0].count = 0;

        // if (oldVersion) {
        //     let shift4 = tableData.pop();
        //     let shift3 = tableData.pop();
        //     tableData.unshift(shift4);
        //     tableData.unshift(shift3);
        // }
        //
        // tableData[0].name = '1 ТВП';
        // tableData[1].name = '2 ТВП';
        // data.state.arrays.SetTimeUse.uses = tableData;
    }

    // Проверка валидности ПК
    function validatePk() {
        setDK.forEach((pk, pkIndex) => {
            pk.sts.forEach((sw, swIndex) => {
                data.state.arrays.SetDK.dk[pkIndex].sts[swIndex].trs = (pk.shift === 0) ? false : (pk.tc === sw.stop);
            })
        })
    }

    // Заполнение переменной count в суточных картах
    function prepareDaySets() {
        daySets.forEach(daySet => {
            let index = 0;
            daySet.lines.forEach(line => {
                if (line.npk !== 0) index++;
            });
            daySet.count = index;
        });
    }

    // Кнопка для создания нового перекрёстка
    $('#addButton').on('click', () => {
        data.state.dgis = points.Y + ',' + points.X;
        ws.send(JSON.stringify({type: 'createB', state: data.state, z: zoom}));
    });

    // Кнопка для обновления данных на АРМе
    $('#reloadButton').on('click', () => {
        ws.send(JSON.stringify({type: 'updateB'}));
    });

    // Кнопка для удаления перекрёстка
    $('#deleteButton').on('click', () => {
        if (confirm('Вы уверены? Перекрёсток будет безвозвратно удалён.')) {
            ws.send(JSON.stringify({
                type: 'deleteB',
                state: data.state
            }));
        }
    });

    // Кнопка для проверки возможности редактирования перекрестка
    $('#checkEdit').on('click', () => {
        ws.send(JSON.stringify({type: 'editInfoB'}));
    });

    // Кнопка для проверки валидности заполненных данных
    $('#checkButton').on('click', () => {
        let sub = $('#subarea').val();
        if ((['+', '-', '.', 'e', 'E'].some(el => sub.includes(el))) || (sub === '')) {
            if (!($('#subMsg').length)) $('#subarea').parent().append('<div style="color: red;" id="subMsg"><h5>Некорректный номер подрайона</h5></div>');
        } else {
            if (($('#subMsg').length)) $('#subMsg').remove();
            for (let i = 1; i < 13; i++) {
                setDK[i - 1].pk = i;
            }
            ws.send(JSON.stringify({type: 'checkB', state: data.state}));
        }
    });

    $('#workTrigger').on('click', () => {
        if ($('#workPanel').attr('style') !== 'display: block;') {
            $('#workPanel').show();
        } else {
            $('#workPanel').hide();
        }
    });

    $('#questionTrigger').on('click', () => {
        // $('#questionPanel').show();
        if ($('#questionPanel').attr('style') !== 'display: block;') {
            $('#questionPanel').show();
        } else {
            $('#questionPanel').hide();
        }
    });

    $('#markdown').on('click', () => {
        $.ajax({
            url: location.origin + '/file/static/markdown/crossControl.md',
            type: 'GET',
            success: function (data) {
//            console.log(data.editInfo);
//                 if (data.editInfo.kick) window.close();
                let converter = new showdown.Converter(),
                    text = data,
                    html = converter.makeHtml(text);
                html = '<div class="row"><div class="col-md-10">' + html + '</div></div>';
                $('#questionTrigger').show();
                if ($('#questionPanel').attr('style') !== 'display: block;') $('#questionTrigger').trigger('click');
                $('#questionPanel')[0].innerHTML = html;
                // $('#questionPanel').append(html);
            },
            error: function (request) {
                console.log(request.status + ' ' + request.responseText);
                alert(request.status + ' ' + request.responseText);
                window.location.href = window.location.origin;
            }
        });
    });
    // Функционирование кнопки с выводом информации о проверке
    $(".trigger").on('click', () => {
        $(".panel").toggle("fast");
        $(this).toggleClass("active");
        return false;
    });

// Функционал кнопок на вкладке "Основные"
    // Кнопка для возвращения исходных данных
    $('#mainReloadButton').on('click', () => {
        mainTabFill(unmodifiedData, false);
    });

// Функционал кнопок на вкладке "ПК"
    // Кнопка для копирования всей информации выбранного ПК
    $('#pkCopyButton').on('click', () => {
        handleCopy('pk')
        // copyPk = JSON.parse(JSON.stringify(setDK[$('#pkSelect').val()]));
    });

    // Кнопка для перезаписи строки
    $('#pkPasteButton').on('click', () => {
        handlePaste('pk')
        // let selected = $('#pkSelect').val();
        // if (copyPk.length === 0) return;
        // setDK[selected] = JSON.parse(JSON.stringify(copyPk));
        // pkTabFill('pkTable');
    });

    // Кнопка для возвращения исходных данных
    $('#pkReloadButton').on('click', () => {
        pkTabFill2(unmodifiedData, false);
    });

    // Кнопка для обнуления текущего ПК
    $('#pkNewButton').on('click', () => {
        let selected = $('#pkSelect').val();
        setDK[selected].sts.forEach((row, index) => {
            if (index !== 0) row.num = 0;
            row.start = 0;
            row.stop = 0;
            row.tf = 0;
            row.plus = false;
        });
        setDK[selected].shift = 0;
        // setDK[selected].tc = 60;
        generateNewPk(setDK[selected].sts);
        pkTabFill2(data, false);
    });

    // Кнопка для добавления строки
    $('#tf').on('change', () => {
        let index = $('#pkTable').find('tr.success').data('index');
        let tf = Number($('#tf').val());

        if (tf === -1) return;

        if ((tf === 2) || (tf === 3)) {
            addPkSwitch(index, tf, (tf === 2) ? 2 : 3);
            addPkSwitch(index + 1, 7, 1);
        } else if (tf === 4) {
            addPkSwitch(index, tf, 4);
            addPkSwitch(index + 1, 5, 2);
            addPkSwitch(index + 2, 6, 3);
            addPkSwitch(index + 3, 7, 1);
        } else {
            addPkSwitch(index, tf);
        }
        $('#tf').val(-1);
    });

    // Кнопка для перезаписи всей информации выбранного ПК
    $('#switchDel').on('click', () => {
        let index = $('#pkTable').find('tr.success').data('index');
        deleteSwitch(index);
    });

// Функционал кнопок на вкладке "Сут. карты"
    // Кнопка для добавления новой строки
    $('#skAddButton').on('click', () => {
        let index = $('#skTable').find('tr.success').data('index');
        let selected = $('#mapNum').val();
        let oldData = [];
        let counter = 0;

        if (getSelectedRowData('skTable', 'lines') === undefined) return;

        $('#skTable tbody tr').each(function () {
            oldData.push(getSelectedRowData('skTable', 'lines', counter++));
        });

        counter = 0;
        oldData.splice(index, 0, Object.assign({}, oldData[index]));
        oldData.pop();
        oldData.forEach(rec => {
            rec.line = ++counter;
        });

        daySets[selected].lines = oldData;

        newTableFill('skTable', skTableFlag);
    });

    // Кнопка для удаления строки
    $('#skSubButton').on('click', () => {
        let index = $('#skTable').find('tr.success').data('index');
        let selected = $('#mapNum').val();
        let oldData = [];
        let counter = 0;
        let emptyRow = {npk: 0, hour: 0, min: 0, line: 12};

        if (getSelectedRowData('skTable', 'lines') === undefined) return;

        $('#skTable tbody tr').each(function () {
            oldData.push(getSelectedRowData('skTable', 'lines', counter++));
        });

        counter = 0;
        oldData.splice(index, 1);
        oldData.push(emptyRow);
        oldData.forEach(rec => {
            rec.line = ++counter;
        });

        daySets[selected].lines = oldData;

        newTableFill('skTable', skTableFlag);
    });

    // Кнопка для копирования строки суточной карты
    $('#skCopyButton').on('click', () => {
        handleCopy('sk')
        // copySk = [];
        // $('#skTable tr.success input')
        //     .each((i, input) => copySk.push(input.value));
    });

    // Кнопка для перезаписи строки суточной карты
    $('#skPasteButton').on('click', () => {
        handlePaste('sk')
        // $('#skTable').find('tr.success').find('input')
        //     .each((index, input) => $(input).val(copySk[index]))
        //     .change();
    });

    // Кнопка для загрузки исходных данных
    $('#skReloadButton').on('click', () => {
        data.state.arrays.DaySets = JSON.parse(JSON.stringify(unmodifiedData.state.arrays.DaySets));
        skTabFill(false);
    });

    // Кнопка для обнуления текущей суточной карты
    $('#skNewButton').on('click', () => {
        let selected = $('#mapNum').val();
        data.state.arrays.DaySets.daysets[selected].lines.forEach(row => {
            row.npk = 0;
            row.hour = 0;
            row.min = 0;
        });
        skTabFill(false);
    });

// Функционал кнопок на вкладке "Нед. карты"
    // Кнопка для копирования строки
    $('#nkCopyButton').on('click', () => {
        handleCopy('nk');
        // copyNk = [];
        // $('#nkTable tr.success input')
        //     .each((i, input) => copyNk.push(input.value));
    });

    // Кнопка для перезаписи строки
    $('#nkPasteButton').on('click', () => {
        handlePaste('nk')
        // $('#nkTable').find('tr.success').find('input')
        //     .each((index, input) => $(input).val(copyNk[index]))
        //     .change();
    });

    // Кнопка для загрузки исходных данных
    $('#nkReloadButton').on('click', () => {
        data.state.arrays.WeekSets = JSON.parse(JSON.stringify(unmodifiedData.state.arrays.WeekSets));
        nkTabFill();
    });

    // Кнопка для обнуления текущей недельной карты
    $('#nkNewButton').on('click', () => {
        const blankArr = Array.from({length: 7}, () => 0); // пустой массив из 7 нулевых элементов
        data.state.arrays.WeekSets.wsets.forEach(row => {
            row.days = blankArr.slice();
        });
        nkTabFill();
    });

// Функционал кнопок на вкладке "Карта года"
    // Кнопка для копирования строки
    $('#gkCopyButton').on('click', () => {
        handleCopy('gk');
        // copyGk = [];
        // $('#gkTable tr.success input')
        //     .each((i, input) => copyGk.push(input.value));
    });

    // Кнопка для перезаписи строки
    $('#gkPasteButton').on('click', () => {
        handlePaste('gk')
        // $('#gkTable').find('tr.success').find('input')
        //     .each((index, input) => $(input).val(copyGk[index]))
        //     .change();
    });

    // Кнопка для загрузки исходных данных
    $('#gkReloadButton').on('click', () => {
        data.state.arrays.MonthSets = JSON.parse(JSON.stringify(unmodifiedData.state.arrays.MonthSets));
        gkTabFill();
    });

    // Кнопка для обнуления текущей годовой карты
    $('#gkNewButton').on('click', () => {
        const blankArr = Array.from({length: 31}, () => 1); // массив из 31 нулевого элемента
        data.state.arrays.MonthSets.monthset.forEach(row => {
            row.days = blankArr.slice();
        });
        gkTabFill();
    });

// Функционал кнопок на вкладке "Контроль входов"

    // Кнопка для копирования строки
    $('#kvCopyButton').on('click', () => {
        handleCopy('kv');
        // copyPk = JSON.parse(JSON.stringify(getSelectedRowData('kvTable')));
    });

    // Кнопка для перезаписи строки
    $('#kvPasteButton').on('click', () => {
        handlePaste('kv')
        // if (getSelectedRowData('kvTable') === undefined) return;
        // stageSets[$('#kvTable').find('tr.success').data('index')] = JSON.parse(JSON.stringify(copyPk));
        // newTableFill('kvTable', kvTableFlag);
    });

    // Кнопка для загрузки исходных данных
    $('#kvReloadButton').on('click', () => {
        data.state.arrays.SetCtrl = JSON.parse(JSON.stringify(unmodifiedData.state.arrays.SetCtrl));
        kvTabFill();
    });

    // Выбор строк в таблицах по клику
    $('#pkTable').on('click-row.bs.table', function (e, row, element) {
        $('.success').removeClass('success');
        $(element).addClass('success');
        colorizeSelectedRow('pkTable');
    });
    $('#skTable').on('click-row.bs.table', function (e, row, element) {
        $('.success').removeClass('success');
        $(element).addClass('success');
        colorizeSelectedRow('skTable');
    });
    $('#nkTable').on('click-row.bs.table', function (e, row, element) {
        $('.success').removeClass('success');
        $(element).addClass('success');
        colorizeSelectedRow('nkTable');
    });
    $('#gkTable').on('click-row.bs.table', function (e, row, element) {
        $('.success').removeClass('success');
        $(element).addClass('success');
        colorizeSelectedRow('gkTable');
    });
    $('#kvTable').on('click-row.bs.table', function (e, row, element) {
        $('.success').removeClass('success');
        $(element).addClass('success');
        colorizeSelectedRow('kvTable');
    });

    // Функционирование выбора СК и ПК
    $('#mapNum').on('change keyup', () => {
        newTableFill('skTable', skTableFlag);
    });

    $('#pkSelect').on('change keyup', () => {
        pkTabFill('pkTable');
    });

    function handleCopy(id) {
        const copyArr = JSON.parse(localStorage.getItem('copyArr'));
        switch (id) {
            case 'pk':
                copyArr['pk'] = setDK[$('#pkSelect').val()];
                break;
            case 'sk':
                copyArr['sk'] = daySets[$('#mapNum').val()];
                break;
            case 'nk':
                copyArr['nk'] = weekSets;
                break;
            case 'gk':
                copyArr['gk'] = monthSets;
                break;
            case 'kv':
                copyArr['kv'] = stageSets;
                break;
        }
        localStorage.setItem('copyArr', JSON.stringify(copyArr));
    }

    function handlePaste(id) {
        const copyArr = JSON.parse(localStorage.getItem('copyArr'));
        switch (id) {
            case 'pk':
                copyArr['pk'].pk = Number($('#pkSelect').val()) + 1;
                copyArr['pk'].desc = 'План координации ' + (copyArr['pk'].pk);
                setDK[$('#pkSelect').val()] = copyArr['pk']
                pkTabFill('pkTable')
                break;
            case 'sk':
                data.state.arrays.DaySets.daysets[$('#mapNum').val()] = copyArr['sk']
                copyArr['sk'].num = Number($('#mapNum').val()) + 1;
                skTabFill(false)
                break;
            case 'nk':
                data.state.arrays.WeekSets.wsets = copyArr['nk']
                nkTabFill()
                break;
            case 'gk':
                data.state.arrays.MonthSets.monthset = copyArr['gk']
                gkTabFill()
                break;
            case 'kv':
                data.state.arrays.SetCtrl.Stage = copyArr['kv']
                kvTabFill()
                break;
        }
    }

    // Функционирование карты для выбора координат
    ymaps.ready(() => {
        // Создание и первичная настройка карты
        map = new ymaps.Map('map', {
            center: [points.Y, points.X],
            zoom: 15
        });
        console.log(points);
        map.events.add(['wheel', 'mousemove'], function () {
            zoom = map._zoom;
        });

        map.events.add('click', function (event) {
            zoom = map._zoom;
            let coords = event.get('coords');
            points.Y = coords[0].toPrecision(9);
            points.X = coords[1].toPrecision(9);
            map.setCenter([points.Y, points.X], zoom);
            map.balloon.open(coords, {
                contentHeader: 'Светофор появится на этом месте карты!',
                contentBody: '<p>Щелкните на крестик в левом верхнем углу</p>'
            });
            let $this = $('#map');
            let offset = $this.offset();
            let width = $this.width();
            let height = $this.height();

            let centerX = offset.left + width / 2;
            let centerY = offset.top + height / 2;

            let projection = map.options.get('projection');

            let minus = projection.fromGlobalPixels(
                map.converter.pageToGlobal([centerX - 225, centerY + 225]), map.getZoom()
            );
            let plus = projection.fromGlobalPixels(
                map.converter.pageToGlobal([centerX + 225, centerY - 225]), map.getZoom()
            );

            let distance = ymaps.formatter.distance(
                ymaps.coordSystem.geo.getDistance([plus[0], minus[1]], [plus[0], plus[1]]), 10
            ).split('&#160;');

            data.state.scale = ((distance[1] === 'км') ? parseFloat(distance[0]) * 1000 : parseFloat(distance[0])) / 450;


            if (!map.balloon.isOpen()) {
                $('.areaMap').show().attr('style', 'overflow: auto; position: absolute; z-index: 2;').css({
                    top: centerY - 225,
                    left: centerX - 225
                });
            } else {
                map.balloon.close();
                $('.areaMap').hide();
            }
        });

        $('#map').css({height: $(window).height / 2, width: $(window).width / 2});

        $('#map').on('click', () => {
            coordinatesChangeFlag = true;
            $('#checkButton').prop('disabled', false);
        })
    });
});

// Набор функций корректной работы АРМ

// Функция для загрузки данных с сервера
function loadData(newData, firstLoadFlag) {

    // console.log(newData);
    let coords = newData.state.dgis.split(',');
    points.Y = coords[0];
    points.X = coords[1];
    data = newData;

    $('#table').bootstrapTable('removeAll');
    $('#pkTable').bootstrapTable('removeAll');
    $('#skTable').bootstrapTable('removeAll');
    $('#nkTable').bootstrapTable('removeAll');
    $('#gkTable').bootstrapTable('removeAll');
    $('#vvTable').bootstrapTable('removeAll');
    $('#vv2Table').bootstrapTable('removeAll');
    $('#kvTable').bootstrapTable('removeAll');

    if (firstLoadFlag) {
        $('#forceSendButton').on('click', () => {
            controlSend(newData.state.idevice);
        });
    }

    // Основная вкладка
    mainTabFill(data, firstLoadFlag);

    // Вкладка ПК
    pkTabFill2(data, firstLoadFlag);

    // Вкладка сут. карт
    skTabFill(firstLoadFlag);

    // Вкладка нед. карт
    nkTabFill();

    // Вкладка карт года
    gkTabFill();

    // Вкладка внеш. входов
    vvTabFill(firstLoadFlag);

    // Зануление второго элемента массива (так надо)
    for (const [key] of Object.entries(data.state.arrays.defstatis.lvs[1])) {
        data.state.arrays.defstatis.lvs[1][key] = 0;
    }

    // Вкладка контроля входов
    kvTabFill();

    setKeyboardNavigate();

    $('input').each(function () {
        $(this).on('click keypress', () => disableUnchecked());
    });

    $('select').each(function () {
        $(this).on('click keypress', () => disableUnchecked());
    });

    $('input, select').each(function () {
        $(this).on('change', () => {
            setTimeout(() => {
                $('#checkButton').prop('disabled',
                    coordinatesChangeFlag ? false : (JSON.stringify(data)) === (JSON.stringify(unmodifiedData))
                )
            }, 50)
        })
    });

    unmodifiedData = JSON.parse(JSON.stringify(data));
    checkNew();

    $('input').not('table input').not('#tc').not('[type=checkbox]').each(({}, input) => {
        calcInputWidth(input);
        $(input).on('keyup', () => calcInputWidth(input));
    })
}

// Отключает функционал некоторых кнопок, если данные не проверены
function disableUnchecked() {
    disableControl('sendButton', false);
    disableControl('addButton', false);
}

// Навигация по таблицам с помощью стрелочек, Enter и Tab
function setKeyboardNavigate(table) {
    table = (table === undefined) ? document : $('#nav-tab').find('a[aria-selected=true]')[0].id;

    $(table).find('table').each(function () {
        $(this).find('input').on('keydown', function (event) {
            handleKeyboard($(this), event);
        });
    });
}

function handleKeyboard($this, event) {
    let cellIndex = $this.parents('td').index();
    switch (event.which) {
        case 37: // left arrow
            $this.closest('td').prevAll('td').find("input").focus().select();
            break;

        case 38: // up arrow
            $(event.target).closest('tr').prevAll('tr').first().find('td').eq(cellIndex).find('input').trigger('click').focus().select();
            break;

        case 9: // Tab
        case 13: // Enter
        case 39: // right arrow
            $this.closest('td').nextAll('td').find("input").not(":hidden").first().focus().select();
            break;

        case 40: // down arrow
            $(event.target).closest('tr').nextAll('tr').find('td').eq(cellIndex).find('input').trigger('click').focus().select();
            break;

        default:
            return; // exit this handler for other keys
    }

    event.preventDefault();
}

function calcInputWidth(input) {
    $(input).width(((($(input).val().length + 1) * 8)) + 'px');
}

// Заполнение вкладки "Основные"
function mainTabFill(data, firstLoadFlag) {
    for (let area in data.areaMap) {
        if (firstLoadFlag) $('#area').append(new Option(data.areaMap[area], area));
    }
    $('#id').val(data.state.id).on('change', () => {
        if ($('#id').val() > 255) $('#id').val(255);
        checkNew(false);
    });
    setChange('id', 'input');
    setChange('idevice', 'input');
    $('#idevice').val(data.state.idevice).on('change', () => {
        checkNew(false);
    });
    setChange('area', 'select');
    $('#area option[value=' + data.state.area + ']').attr('selected', 'selected');
    setChange('type', 'select', 'arrays');
    $('#type option[value=' + data.state.arrays.type + ']').attr('selected', 'selected');
    $('#subarea').val(data.state.subarea);
    setChange('subarea', 'input');
    $('#name').val(data.state.name);
    setChange('name', 'input');
    $('#phone').val(data.state.phone);
    setChange('phone', 'input');
    $('#ip')[0].innerText = 'IP: ' + data.deviceIP;
    $('#wifi').val(data.state.wifi).width(calcInputWidth($('#wifi')[0]));
    setChange('wifi', 'input');
    $('#tz').val(data.state.arrays.timedev.tz);
    setChange('tz', 'input', 'arrays.timedev');
    $('#summer').prop('checked', data.state.arrays.timedev.summer);
    setChange('summer', 'checkbox', 'arrays.timedev');

    $('#vpcpd').val((parseFloat(data.state.Model.vpcpdl + '.' + data.state.Model.vpcpdr) <= 12.3) ? 12.3 : 12.4);
    Number($('#vpcpd').val()) <= 12.3 ?
        sizeVerification(8, true) :
        sizeVerification(18, false);
    $('#vpcpd').on('change keyup', () => {
        let ver = $('#vpcpd option:selected').val().split('.');
        data.state.Model.vpcpdl = Number(ver[0]);
        data.state.Model.vpcpdr = Number(ver[1]);
    });

    $('#vpbsl').val(data.state.Model.vpbsl);
    setChange('vpbsl', 'input', 'Model');
    $('#vpbsr').val(data.state.Model.vpbsr);
    setChange('vpbsr', 'input', 'Model');

    anotherTableFill('table', mainTableFlag);
}

// Верификация массива ПК
function validatePkArray(data) {
    data.state.arrays.SetDK.dk.forEach(pk => {
        while (pk.sts.length !== 12) {
            pk.sts.push({dt: 0, line: pk.sts.length + 1, num: 0, plus: false, start: 0, stop: 0, tf: 0, trs: false})
        }
        if (pk.tc > 3) pk.sts[0].num = 1;
        pk.sts.forEach((sw, index) => sw.line = index + 1);
    })
}

function sizeVerification(length, oldVersion) {
    let vvTable = data.state.arrays.SetTimeUse.uses;
    let emptyRecord = {
        'dk': 0,
        'fazes': '',
        'long': 0,
        'name': '',
        'tvps': 0,
        'type': 0
    };
    if (vvTable.length !== length) {
        if (vvTable.length < length) {
            while (vvTable.length !== length) {
                vvTable.push(Object.assign({}, emptyRecord));
            }
        }
        if (vvTable.length > length) {
            while (vvTable.length !== length) {
                vvTable.pop();
            }
        }
    }
    if (oldVersion) {
        for (let i = 2; i < length; i++) {
            vvTable[i - 2].name = (i - 1) + ' вх';
        }
        let shift4 = data.state.arrays.SetTimeUse.uses.pop();
        let shift3 = data.state.arrays.SetTimeUse.uses.pop();
        data.state.arrays.SetTimeUse.uses.unshift(shift4);
        data.state.arrays.SetTimeUse.uses.unshift(shift3);

        data.state.arrays.SetTimeUse.uses[0].name = '1 ТВП';
        data.state.arrays.SetTimeUse.uses[1].name = '2 ТВП';
    } else {
        for (let i = 2; i < length; i++) {
            vvTable[i].name = (i - 1) + ' вх';
        }
    }
}

// Заполнение вкладки "ПК"
function pkTabFill2(newData, firstLoadFlag) {
    setDK = JSON.parse(JSON.stringify(newData)).state.arrays.SetDK.dk;

    if (firstLoadFlag) {
        setChange('tc', 'input', 'arrays.SetDK.dk');
        setChange('twot', 'checkbox', 'arrays.SetDK.dk');
        setChange('shift', 'input', 'arrays.SetDK.dk');
        setChange('tpu', 'select', 'arrays.SetDK.dk');
        $('#tpu').on('change keyup', function (evt) {
            if (evt.target.value === '1') {
                $('#shift').val(0).change().prop('disabled', true);
                $('#tc').prop('disabled', true);
            } else {
                $('#shift').prop('disabled', false);
                $('#tc').prop('disabled', false);
            }
            $('#razlen').change();
        });
        setChange('razlen', 'checkbox', 'arrays.SetDK.dk');
        setChange('desc', 'input', 'arrays.SetDK.dk');
    }
    pkTabFill('pkTable');
}

// Заполнение вкладки "Сут. карты"
function skTabFill(firstLoadFlag) {
    daySets = data.state.arrays.DaySets.daysets;
    daySets.forEach(daySet => {
        if (firstLoadFlag) $('#mapNum').append(new Option(daySet.num, daySet.num - 1));
    });
    newTableFill('skTable', skTableFlag);
}

// Заполнение вкладки "Нед. карты"
function nkTabFill() {
    weekSets = data.state.arrays.WeekSets.wsets;
    tableFill(weekSets, 'nkTable', nkTableFlag);
}

// Заполнение вкладки "Карты года"
function gkTabFill() {
    monthSets = data.state.arrays.MonthSets.monthset;
    tableFill(monthSets, 'gkTable', gkTableFlag);
}

// Заполнение вкладки "Внеш. входы"
function vvTabFill(firstLoadFlag) {
    anotherTableFill('vvTable', vvTableFlag);

    $('#ite').val(data.state.arrays.SetTimeUse.ite);
    if (firstLoadFlag) {
        setChange('ite', 'input', 'arrays.SetTimeUse');
        $('#ite').on('change', () => {
            data.state.arrays.defstatis.lvs[0].ninput = Number($('#ite').val());
        });
    }

    $('#tuin').val(data.state.arrays.defstatis.lvs[0].period);
    if (firstLoadFlag) {
        $('#tuin').on('change', () => {
            data.state.arrays.defstatis.lvs[0].period = Number($('#tuin').val());
        });
    }

    tableFill([0], 'vv2Table', vv2TableFlag);
}

// Заполнение вкладки "Контроль входов"
function kvTabFill() {
    stageSets = data.state.arrays.SetCtrl.Stage;
    newTableFill('kvTable', kvTableFlag);
}


// Функция для заполнения таблиц недельных карт, годовых карт и длительности МГР при неисправности ДТ
function tableFill(set, table, staticFlag) {
    $('#' + table).bootstrapTable('removeAll');
    set.forEach(function () {
        $('#' + table).bootstrapTable('append', '');
    });

    let counter = -1;
    $(`#${table} tbody tr`).each(function () {
        let dayCounter = 0;
        counter++;
        $(this).find('td').each(function () {
            if (dayCounter++ === 0) {
                $(this).append(staticFlag ? 'Интервал,с' : set[counter].num);
            } else {
                $(this).append(
                    '<input class="form-control border-0"' +
                    'style="min-width: 43px; max-width: 43px;" name="number" type="number" value="' +
                    (staticFlag ? data.state.arrays.SetTimeUse.notwork[dayCounter - 2] : set[counter].days[dayCounter - 2]) + '" required/>'
                );
            }
        })
    });

    $(`#${table} thead th`).each(function () {
        $(this).attr('style', 'text-align: center; min-width: 45px;')
    });

    if (firstLoad) tableChange(set, table, !staticFlag);
}

// Функция для сохранения изменений в таблицах недельных карт, годовых карт и длительности МГР при неисправности ДТ
function tableChange(set, table, daysFlag) {
    $('#' + table).on('change', () => {
        let counter = 0;
        $(`#${table} tbody tr`).each(function () {
            let setArr = [];
            $(this).find('td').each(function () {
                let value = Number($(this).find('input').val());
                if (!isNaN(value)) setArr.push(value);
            });
            (daysFlag) ? set[counter++].days = setArr : data.state.arrays.SetTimeUse.notwork = setArr;
        });
        // console.log(data.state);
    })
}

// Функция для заполнения таблиц параметров ДК и использования внешних входов
function anotherTableFill(table, tableFlag) {
    $('#' + table).bootstrapTable('removeAll')
        .bootstrapTable('append', (tableFlag ? data.state.arrays.SetupDK : data.state.arrays.SetTimeUse.uses));
    $(`#${table} tbody tr`).each(function () {
        let counter = 0;
        $(this).find('td').each(function () {
            let value = $(this).text();
            let type = tableFlag ? 'number' : (((counter === 0) || (counter === 4)) ? 'text' : 'number');
            $(this).text('');
            if ((counter === 0) && (!tableFlag)) {
                $(this).append(value);
            } else {
                $(this).append('<input class="form-control border-0" type="' + type + '" value="' + value + '" />');
            }
            counter++;
        });
    });
    if (firstLoad) anotherTableChange(table, tableFlag);
}

// Функция для сохранения изменений в вышеперечисленных таблицах
function anotherTableChange(table, tableFlag) {
    $('#' + table).on('change', () => {
        let names = [];
        $(`#${table} thead th`).each(function () {
            names.push($(this).attr('data-field'));
        });
        let recCounter = 0;
        $(`#${table} tbody tr`).each(function () {
            let counter = -1;
            $(this).find('td').each(function () {
                let value = $(this).find('input').val();
                if (tableFlag) {
                    data.state.arrays.SetupDK[names[++counter]] = Number(value);
                } else {
                    if (value !== undefined) data.state.arrays.SetTimeUse.uses[recCounter][names[++counter + 1]] = (counter === 3) ? value : Number(value);
                }
            });
            recCounter++;
        });
        console.log(data.state);
    });
}

// Функция для заполнения таблиц суточных карт и контроля входов
function newTableFill(table, tableFlag) {
    let selected = $('#mapNum').val();
    if (skFlag || kvFlag) {
        if (firstLoad) (tableFlag ? skTableChange(table) : kvTableChange(table));
    }
    $('#' + table).bootstrapTable('removeAll');
    let set = (tableFlag ? daySets : stageSets);

    set.forEach(function () {
        $('#' + table).bootstrapTable('append', '');
    });

    let counter = -1;
    $(`#${table} tbody tr`).each(function () {
        let dayCounter = 0;
        let endFlag = false;
        counter++;
        $(this).find('td').each(function () {
            let prevArr = [];
            if (counter > 0) prevArr = (tableFlag ? daySets[selected].lines[counter - 1] : stageSets[counter - 1]);
            let currArr = (tableFlag ? daySets[selected].lines[counter] : stageSets[counter]);
            if (tableFlag) {
                if ((prevArr.hour === 24) && (prevArr.min === 0)) endFlag = true;
            } else if (counter > 0) {
                if ((prevArr.end.hour === 24) && (prevArr.end.min === 0)) endFlag = true;
            }
            switch (dayCounter++) {
                case 0:
                    $(this).append(counter + 1);
                    break;
                case 1:
                    if (endFlag) {
                        $(this.append('00:00'));
                    } else {
                        $(this).append(((counter === 0) ? '00' : handsomeNumbers((tableFlag ? prevArr.hour : prevArr.end.hour))) + ':' +
                            ((counter === 0) ? '00' : handsomeNumbers((tableFlag ? prevArr.min : prevArr.end.min))));
                    }
                    break;
                case 2:
                    $(this).append(
                        '<div class="container"><div class="row"><input class="form-control border-0 col-md-5" ' +
                        'style="max-width: 45px;" name="number" type="number" value="' +
                        handsomeNumbers((tableFlag ? currArr.hour : currArr.end.hour)) + '" required/> ' + '<div style="margin-top: 6px;">:</div>' +
                        '<input class="form-control border-0 col-md-5" style="max-width: 45px;" name="number" ' +
                        'type="number" value="' + handsomeNumbers((tableFlag ? currArr.min : currArr.end.min)) +
                        '" required/></div></div>'
                    );
                    break;
                case 3:
                    $(this).append(
                        '<input class="form-control border-0" name="number" type="number" ' +
                        'style="max-width: 50px;" value="' + (tableFlag ? currArr.npk : currArr.lenTVP) + '"/>'
                    );
                    break;
                case 4:
                    $(this).append(
                        '<input class="form-control border-0" name="number" type="number" ' +
                        'style="max-width: 50px;" value="' + currArr.lenMGR + '"/>'
                    );
                    break;
            }
        });
    });
}

// Функция для сохранения изменений в таблице суточных карт, а также заполнение столбца "T начала"
function skTableChange(table) {
    $('#' + table).on('change', () => {
        let selected = $('#mapNum').val();
        let tableData = [];
        let endOfTheDay = -1;

        $(`#${table} tbody tr`).each(function (index) {
            let rec = [];
            $(this).find('td').each(function () {
                $(this).find('input').each(function () {
                    let value = Number(($(this).val().startsWith('0')) ? $(this).val().substring(1, 2) : $(this).val());
                    if ((value === 24) && (endOfTheDay === -1)) endOfTheDay = index;
                    rec.push(((endOfTheDay !== -1) && (index > endOfTheDay)) ? 0 : value);
                })
            });
            tableData.push(rec);
        });
        let counter = 0;
        daySets[selected].lines.forEach(variable => {
            variable.npk = tableData[counter][2];
            variable.hour = tableData[counter][0];
            variable.min = tableData[counter++][1];
        });
        data.state.arrays.DaySets.daysets = daySets;
        newTableFill(table, true);
        // console.log(data.state);
    });
    skFlag = false;
}

// Функция для сохранения изменений в таблице контроля входов, а также заполнение столбца "T начала"
function kvTableChange(table) {
    $('#' + table).on('change', () => {
        let tableData = [];
        let endOfTheDay = -1;

        $(`#${table} tbody tr`).each(function (index) {
            let rec = [];
            $(this).find('td').each(function () {
                let text = $(this)[0].innerText;
                if ((text !== ':') && (text !== '')) {
                    if (text.includes(':')) {
                        let time = text.split(':');
                        rec.push(((endOfTheDay !== -1) && (index > endOfTheDay)) ? 0 : Number(time[0]));
                        rec.push(((endOfTheDay !== -1) && (index > endOfTheDay)) ? 0 : Number(time[1]));
                    } else {
                        rec.push(((endOfTheDay !== -1) && (index > endOfTheDay)) ? 0 : Number(text));
                    }
                }
            });
            $(this).find('input').each(function () {
                let value = Number(($(this).val().startsWith('0') && ($(this).val().length > 1)) ? $(this).val().substring(1, 2) : $(this).val());
                if ((value === 24) && (endOfTheDay === -1)) endOfTheDay = index;
                rec.push(((endOfTheDay !== -1) && (index > endOfTheDay)) ? 0 : value);
            });
            tableData.push(rec);
        });

        stageSets.forEach((variable, index) => {
            variable.line = index + 1;
            variable.start.hour = tableData[index][1];
            variable.start.min = tableData[index][2];
            variable.end.hour = tableData[index][3];
            variable.end.min = tableData[index][4];
            variable.lenTVP = tableData[index][5];
            variable.lenMGR = tableData[index][6];
        });
        data.state.arrays.SetCtrl.Stage = stageSets;
        newTableFill(table, false);
        console.log(data.state);
    });
    kvFlag = false;
}

// Функция для заполнения вкладки ПК
function pkTabFill(table) {
    let selected = $('#pkSelect').val();
    let currPK = setDK[selected];
    let tableType = $('#pkTableType').val() === '0';

    $('#' + table).bootstrapTable('removeAll');

    if (pkFlag) {
        pkTableChange(table);
    }

    if (currPK.tc > 2) {
        $('#' + table).show();
        $('#tc').val(currPK.tc);
    } else {
        switch (currPK.tc) {
            case 0:
                $('#tc').val('ЛР');
                break;
            case 1:
                $('#tc').val('ЖМ');
                break;
            case 2:
                $('#tc').val('ОС');
                break;
        }
        resetPkTable();
        $('#' + table).hide();
    }
    $('#twot').prop('checked', currPK.twot);
    $('#shift').val(currPK.shift).prop('disabled', currPK.tpu === 1);
    $('#tc').prop('disabled', currPK.tpu === 1);
    $('#tpu').find('option').each(function () {
        $(this).removeAttr('selected');
    });
    $('#tpu').val(currPK.tpu);
    $('#razlen').prop('checked', currPK.razlen);
    $('#desc').val(currPK.desc);

    currPK.sts.forEach(function () {
        $('#' + table).bootstrapTable('append', '');
    });

    function pkTableDurationFunctional() {
        let difLen = $('#razlen').prop('checked');

        currPK.sts.forEach(function (row, index) {
            let disabledStatusMap = {start: true, tf: true, num: true, duration: true, plus: true};

            if (index === 0) {
                disabledStatusMap.duration = false;
            } else if ((index <= (currPK.sts.length - 1)) && (($('[class~=num' + index + ']').val() !== '0') || ($('[class~=tf' + index + ']').val() !== '0'))) {
                disabledStatusMap.num = (row.tf === 1) || (row.tf === 8);
                disabledStatusMap.tf = false;
                disabledStatusMap.duration = false;
                if (!difLen) {
                    if ((row.tf === 5) || (row.tf === 6) || (row.tf === 7)) disabledStatusMap.duration = true;
                }
            }

            for (const [key, value] of Object.entries(disabledStatusMap)) {
                $('[class~=' + key + index + ']')[0].disabled = value;
            }

        });

        $('#razlen').change();

        if (firstLoad) {
            $('#tc').on('change', () => {
                difLen = $('#razlen').prop('checked');
                let currPk = Number($('#pkSelect').val());
                let currSts = setDK[currPk].sts;
                let shift = Number($('#shift').val());
                let cycleTime = Number($('#tc').val());
                let inputDiff = cycleTime;
                let prevCycleTime = unmodifiedData.state.arrays.SetDK.dk[currPk].tc;
                let switchCount = getSwitchCount(currSts);

                // Проверка особых режимов
                if (isNaN(cycleTime)) {
                    switch ($('#tc').val()) {
                        case 'ЛР':
                            cycleTime = 0;
                            break;
                        case 'ЖМ':
                            cycleTime = 1;
                            break;
                        case 'ОС':
                            cycleTime = 2;
                            break;
                    }
                    setDK[$('#pkSelect').val()].tc = cycleTime;
                }

                // Для особых режимов таблица не нужна
                if (cycleTime < 3) {
                    resetPkTable();
                    $('#' + table).hide();
                    return;
                }

                // время цикла не превышает 254
                if (cycleTime >= 255) {
                    cycleTime = 254;
                    $('#tc').val(cycleTime).change();
                    // setDK[selected].tc = cycleTime;
                } else if ((cycleTime < (4 * switchCount)) && (prevCycleTime > 3)) { // каждая фаза минимум 4 секунд
                    cycleTime = 4 * switchCount;
                    $('#tc').val(4 * switchCount);
                }

                if (shift >= cycleTime) {
                    shift -= cycleTime;
                    $('#shift').val(shift).change();
                }

                $('#' + table).show();

                // Автоматизированное создание нового ПК
                if ((prevCycleTime < 3) && (cycleTime > 3)) {
                    generateNewPk(currSts);
                    return;
                }

                inputDiff = getCycleDiff(inputDiff, currSts, switchCount, difLen);

                $(`#${table} tbody tr`).each(function (index) {
                    // если переключатель не выбран, изменять первый
                    if (this.className === 'success') {
                        let value = Number($('[class~=duration' + index + ']').val());
                        $('[class~=duration' + index + ']').val(value + inputDiff).change();
                        inputDiff = 0;

                    } else if ((inputDiff !== 0) && (index === (getSwitchCount(currSts) - 1))) {
                        let newValue = Number($('[class~=duration' + 0 + ']').val());
                        $('[class~=duration' + 0 + ']').val(newValue + inputDiff).change();
                    }
                })
            });

            $('#tc').on('click', () => {
                if ($('#tc').val() !== '') {
                    $('#tc').val('');
                    $('#tc').trigger('click');
                }
            })

            $('#shift').on('change keyup', (event) => {
                if ((event.type === 'keyup') && (event.originalEvent.code !== 'Enter')) return;

                let selectedPk = Number($('#pkSelect').val());
                let shift = Number($('#shift').val());
                let prevShift = Number($('[class~=start0]').val());
                let cycleTime = Number($('#tc').val());
                let currSts = setDK[selectedPk].sts;
                clearTransition(currSts);

                if (shift >= cycleTime) {
                    shift -= cycleTime;
                    $('#shift').val(shift);
                    currSts.shift = shift;
                }

                let shiftDiff = shift - prevShift;

                currSts.forEach((sw, index) => {
                    if (!checkLastLine(sw)) {
                        sw.start += shiftDiff;

                        if (sw.start === cycleTime) sw.start = 0;

                        if (sw.stop === cycleTime) {
                            sw.stop = sw.start + Number($('[class~=duration' + index + ']').val());
                        } else {
                            sw.stop += shiftDiff;
                        }

                        if (sw.start < 0) sw.start += cycleTime;

                        if (sw.stop < 0) sw.stop += cycleTime;

                        if (sw.start > cycleTime) sw.start -= cycleTime;

                        if (sw.stop > cycleTime) sw.stop -= cycleTime;

                        $('[class~=start' + index + ']').val(sw.start);
                        $('[class~=stop' + index + ']').val(sw.stop);
                    }
                    sw.dt = 0;
                });

                let transition = checkTransition(currSts);
                if (transition.length !== 0) {
                    transition.forEach(trs => {
                        currSts[trs].stop = cycleTime;
                        makeTransition(currSts, trs);
                    });
                }
            });

            $('#razlen').on('change', (evt) => {
                setDK[$('#pkSelect').val()].sts.forEach(function (row, index) {
                    if (row.plus === '') row.plus = false;
                    if ((row.tf > 4) && (row.tf < 8)) {
                        $('[class~=duration' + index + ']')[0].disabled = !$('#razlen').prop('checked');
                    } else if ((row.tf > 1) && (row.tf < 5)) {
                        if (!evt.target.checked) {
                            $('[class~=duration' + index + ']').val(findMaxTvpDuration(setDK[$('#pkSelect').val()].sts, index, row.tf)).change();
                            row.plus = false;
                            $('[class~=plus' + index + ']').val('');
                        }
                        $('[class~=plus' + index + ']')[0].disabled = ($('#tpu').val() === '0') ? !$('#razlen').prop('checked') : true;
                    }
                })
            });
        }
    }

    if (tableType) {
        $('#' + table).bootstrapTable('hideColumn', 'stop');
        $('#' + table).bootstrapTable('showColumn', 'duration');
    } else {
        $('#' + table).bootstrapTable('hideColumn', 'duration');
        $('#' + table).bootstrapTable('showColumn', 'stop');
    }

    $(`#${table} tbody tr`).each(function (index) {
        $(this).find('td').each(function (switchIndex) {
            let record = currPK.sts[index];
            switch (switchIndex) {
                case 0:
                    $(this).append(record.line);
                    break;
                case 1:
                    $(this).append(
                        `<input class="form-control border-0 start${index}" name="number" type="number"` +
                        'style="max-width: 55px;" value="' + record.start + '"/>'
                    );
                    $(this).find('input').on('change', function (evt) {
                        let tf = Number($(`[class~=tf${index}]`).val());
                        if ((tf === 2) || (tf === 3)) {
                            if (Number($('[class~=tf' + (index + 1) + ']').val()) === 7) {
                                currPK.sts[index + 1].start = evt.target.valueAsNumber;
                            }
                        } else if (tf === 4) {
                            let replacementCount = findReplacementCount(currPK.sts, index);
                            for (let i = index; i < (index + replacementCount); i++) {
                                currPK.sts[i + 1].start = evt.target.valueAsNumber;
                            }
                        }
                    });
                    break;
                case 2:
                    $(this).append(
                        '<select class="tf' + index + '">' +
                        '<option value="0"> </option>' +
                        '<option value="1">МГР</option>' +
                        '<option value="2">1 ТВП</option>' +
                        '<option value="3">2 ТВП</option>' +
                        '<option value="4">1,2 ТВП</option>' +
                        '<option value="5">Зам. 1ТВП</option>' +
                        '<option value="6">Зам. 2ТВП</option>' +
                        '<option value="7">Зам.</option>' +
                        '<option value="8">МДК</option>' +
                        '<option value="9">ВДК</option>' +
                        '</select>'
                    );
                    $(this).find('select').find('option').each(function () {
                        $(this).removeAttr('selected');
                    });
                    $(this).find('select').on('change', function (evt) {
                        const difLen = $('#razlen').prop('checked');

                        $('[class~=duration' + index + ']').prop('disabled', false);
                        if ((evt.target.value === '1') || (evt.target.value === '8')) {
                            // Фазы МГР и МДК всегда имеют № фазы = 0
                            $('[class~=num' + index + ']')
                                .val(0)
                                .prop('disabled', true)
                                .change();
                        } else if ((evt.target.value === '2') || (evt.target.value === '3')) {
                            // При смене типа на ТВП1 или ТВП2 вствляю фазы вместе с Зам`ом
                            let saveStart = Number($('[class~=start' + index + ']').val());
                            let saveStop = saveStart + Number($('[class~=duration' + index + ']').val());
                            deleteSwitch(index);
                            addPkSwitch(index - 1, Number(evt.target.value), (evt.target.value === '2') ? 2 : 3, saveStart, saveStop);
                            addPkSwitch(index, 7, 1, saveStart, saveStop);
                        } else if (evt.target.value === '4') {
                            // При смене типа на 1,2 ТВП вствляю связку со всеми Зам`ами
                            let saveStart = Number($('[class~=start' + index + ']').val());
                            let saveStop = saveStart + Number($('[class~=duration' + index + ']').val());
                            deleteSwitch(index);
                            addPkSwitch(index - 1, 4, 4, saveStart, saveStop);
                            addPkSwitch(index, 5, 2, saveStart, saveStop);
                            addPkSwitch(index + 1, 6, 3, saveStart, saveStop);
                            addPkSwitch(index + 2, 7, 1, saveStart, saveStop);
                        } else {
                            if ((evt.target.value === '5') || (evt.target.value === '6') || (evt.target.value === '7')) {
                                // При смене типа на один из Зам`ов проверка возможности редакции длительности
                                $('[class~=duration' + index + ']').prop('disabled', !difLen)
                            }
                            $('[class~=num' + index + ']')
                                .val((Number($('[class~=num' + index + ']').val()) === 0) ? 1 : $('[class~=num' + index + ']').val())
                                .prop('disabled', false)
                                .change();
                        }
                    });
                    $(this).find('option[value="' + record.tf + '"]').attr('selected', 'selected');
                    break;
                case 3:
                    $(this).append(
                        '<input class="form-control border-0 num' + index + '" name="number" type="number"' +
                        'style="max-width: 55px;" value="' + record.num + '"/>'
                    );
                    break;
                case 4:
                    $(this).attr('class', 'justify-content-center');
                    $(this).append(
                        '<input class="form-control border-0 duration' + index + '" name="number" type="number"' +
                        'style="max-width: 55px;" value="' + ((tableType) ? (record.stop - record.start) : record.stop) + '"/>'
                    );
                    $(this).find('input').on('keyup change', (event) => {
                        if ((event.type === 'keyup') && (!event.originalEvent.code.includes('Enter'))) return;

                        const controlType = $('#tpu').val();
                        const cycleTime = Number($('#tc').val());
                        const shift = Number($('#shift').val());
                        let currSts = setDK[Number($('#pkSelect').val())].sts;
                        let swId = event.target.parentElement.parentElement.rowIndex - 1;
                        const switchCount = getSwitchCount(currSts);
                        const lastSwitch = (swId === currSts.length - 1) || (checkLastLine(currSts[swId + 1]));
                        let value = event.target.valueAsNumber;
                        let inputDiff = cycleTime;
                        const difLen = $('#razlen').prop('checked');
                        const currTf = Number($(`[class~=tf${swId}]`).val());

                        if (cycleTime === 0) return;

                        // Минимальная длительность фазы
                        if (value < 4) {
                            $('[class~=duration' + swId + ']').val(4).change();
                            return;
                        }

                        if (!difLen) {
                            // Если не стоит признак "разн. длит.", длительности Зам`ов равны длительности фазы ТВП
                            if (((currTf === 2) || (currTf === 3)) && (Number($(`[class~=tf${swId + 1}`).val()) === 7)) {
                                $(`[class~=duration${swId + 1}`).val($(`[class~=duration${swId}`).val());
                            } else if (currTf === 4) {
                                let replCount = findReplacementCount(currSts, swId);
                                for (let i = 0; i < replCount; i++) {
                                    $(`[class~=duration${swId + 1 + i}`).val($(`[class~=duration${swId}`).val());
                                }
                            }
                        }

                        inputDiff = getCycleDiff(inputDiff, currSts, switchCount, difLen);

                        currSts[swId].start = (swId === 0) ? shift : currSts[swId - 1].stop;
                        currSts[swId].stop = currSts[swId].start + value;
                        $('[class~=start' + swId + ']').val(currSts[swId].start).change();

                        if (inputDiff !== 0) {
                            // Если сумма длительностей или цикл поменялись
                            if (controlType === '0') {
                                // Тип ПУ = ПК. При изменении меняется длительность следующей фазы
                                let index = 0;
                                let tf = Number($('[class~=tf' + (lastSwitch ? 0 : swId + 1) + ']').val());
                                if (!lastSwitch) {
                                    if ((tf === 5) || (tf === 6)) {
                                        // Зам. ТВП 1, Зам. ТВП 2
                                        let replCount = findReplacementCount(currSts, swId);
                                        index = (((swId + replCount) === currSts.length - 1) || (checkLastLine(currSts[swId + replCount + 1]))) ? 0 : swId + replCount + 1;
                                    } else if (tf === 7) {
                                        // Зам.
                                        index = (((swId + 2) === currSts.length - 1) || (checkLastLine(currSts[swId + 2]))) ? 0 : swId + 2;
                                    } else {
                                        index = swId + 1;
                                    }
                                }
                                let newValue = Number($('[class~=duration' + index + ']').val()) + inputDiff;
                                $('[class~=duration' + index + ']').val(newValue).change();
                            } else if (controlType === '1') {
                                // Тип ПУ = ЛПУ. При изменении меняется длительность цикла
                                if ((cycleTime - inputDiff) > 254) inputDiff = cycleTime - 254;
                                setDK[Number($('#pkSelect').val())].tc -= inputDiff;
                                $('#tc').val(cycleTime - inputDiff).change();
                            }
                        }
                        validatePkByDuration(currSts, difLen);
                    });
                    break;
                case 5:
                    $(this).append(
                        '<input class="form-control border-0 plus' + index + '" name="text" type="text"' +
                        'style="max-width: 55px;" value="' + (record.plus ? '+' : '') + '"/>'
                    );
                    break;
            }
        });
    });

    pkTableValidate();
    if (tableType) pkTableDurationFunctional();
    $('#razlen').change();
    data.state.arrays.SetDK.dk[selected] = setDK[selected];
    $('#nav-pk .fixed-table-body').height('85vh');
}

// Считается значение, на которое изменилось поле для ввода
function getCycleDiff(cycle, currSts, switchCount, difLen) {
    for (let i = 0; i < switchCount; i++) {
        const tf = Number($('[class~=tf' + (i) + ']').val());
        switch (tf) {
            case 2:
            case 3:
            case 4:
                // При ТВП отнимаем максимальную длительность
                cycle -= findMaxTvpDuration(currSts, i, tf);
                break;
            case 5:
            case 6:
            case 7:
                // При Зам`ах ничего не отнимаем
                // Если стоит признак "разн длит" - подгоняем времена Зам`ов
                if (!difLen) {
                    currSts[i].start = Number($(`[class~=start${i - 1}]`).val());
                    currSts[i].stop = currSts[i].start + Number($(`[class~=duration${i - 1}]`).val());
                    $('[class~=start' + i + ']').val(currSts[i].start);
                    $('[class~=duration' + i + ']').val(currSts[i].stop - currSts[i].start);
                }
                break;
            default:
                //При всех не-ТВПшных фазах просто отнимаем длительность
                cycle -= $('[class~=duration' + (i) + ']').val();
                break;
        }
    }
    return cycle;
}

// Считается количество Зам`ов у фазы ТВП
function findReplacementCount(currSts, swId) {
    let replCounter = 0;
    for (let i = swId + 1; i < currSts.length; i++) {
        ((currSts[i].tf > 4) && (currSts[i].tf < 8)) ? replCounter++ : i = currSts.length;
    }
    return replCounter;
}

// Возвращается максимальная длительность фазы ТВП и её Зам`ов
function findMaxTvpDuration(currSts, index, tf) {
    let tvpDuration = Number($(`[class~=duration${index}]`).val());
    if (tf === 4) {
        //1,2 ТВП
        let replacementDurationArray = [];
        let replacementCount = findReplacementCount(currSts, index);
        for (let i = index; i < (index + replacementCount); i++) {
            replacementDurationArray.push(Number($(`[class~=duration${i + 1}`).val()));
        }
        return Math.max(...replacementDurationArray, tvpDuration);
    } else {
        //Одиночная ТВП
        let replacementDuration = (Number($(`[class~=tf${index + 1}`).val()) === 7) ? Number($(`[class~=duration${index + 1}`).val()) : 0;
        return Math.max(tvpDuration, replacementDuration);
    }
}

// Приведение данных массивов ПК в соотвествие с таблицей на экране
function validatePkByDuration(currSts, difLen) {
    currSts.forEach((sw, index) => {
        let shift = Number($('#shift').val());
        let tf = Number($(`[class~=tf${index}]`).val());

        if (!checkLastLine(sw)) {
            if ((tf < 5) || (tf > 7)) {
                // Не Зам фаза
                if (index === 0) {
                    $(`[class~=start${index}]`).val(shift);
                } else {
                    if (difLen && ((currSts[index - 1].tf > 4) && (currSts[index - 1].tf < 8))) {
                        let tvpIndex = index;
                        while (!((currSts[tvpIndex].tf > 1) && (currSts[tvpIndex].tf < 5))) tvpIndex--;
                        $(`[class~=start${index}]`).val(Number($(`[class~=start${index - 1}]`).val()) + findMaxTvpDuration(currSts, tvpIndex, currSts[tvpIndex].tf));
                    } else {
                        $(`[class~=start${index}]`).val(Number($(`[class~=start${index - 1}]`).val()) + Number($(`[class~=duration${index - 1}]`).val()));
                    }
                }
                currSts[index].start = Number($(`[class~=start${index}]`).val());
            } else {
                // Зам фаза
                currSts[index].start = Number($(`[class~=start${index - 1}]`).val());
                $(`[class~=start${index}]`).val(currSts[index].start);
            }
        }

        sw.stop = Number($(`[class~=duration${index}`).val()) + Number($(`[class~=start${index}`).val());

        if (shift !== 0) $('#shift').change();
    })
}

// Автоматическое создание простого ПК
function generateNewPk(currSts) {
    let cycleTime = Number($('#tc').val());
    currSts[0].start = 0;
    currSts[0].stop = ((cycleTime % 2) === 0) ? cycleTime / 2 : (cycleTime - 1) / 2;
    currSts[1].num = 1;
    $('[class~=num0]').val(1);
    $('[class~=duration0]').val(currSts[0].stop);

    currSts[1].start = ((cycleTime % 2) === 0) ? cycleTime / 2 : (cycleTime + 1) / 2;
    currSts[1].stop = cycleTime;
    currSts[1].num = 2;
    $('[class~=tf1]').prop('disabled', false);
    $('[class~=num1]').val(2).prop('disabled', false);
    $('[class~=duration1]').val(currSts[1].start).prop('disabled', false);
}

// Добавление переключателя в ПК
function addPkSwitch(index, tf, num, start, stop) {
    function sortFunc(a, b) {
        return a[0] - b[0];
    }

    let selected = $('#pkSelect').val();
    if (index === undefined) return;
    let currSts = setDK[selected].sts;
    let newRow = {
        line: index,
        start: (start === undefined) ? (currSts[(index === 0) ? 11 : (index)].stop) : start,
        num: ((tf === 1) || (tf === 8)) ? 0 : (((tf > 1) && (tf < 8)) ? num : 1),
        tf: tf,
        stop: (stop === undefined) ? (currSts[(index === 0) ? 11 : (index)].stop + 4) : stop,
        plus: currSts[(index === 0) ? 11 : (index)].plus,
        dt: 0
    };

    let map = new Map();
    currSts.forEach(sts => {
        map.set(sts.line, sts);
    });
    map.delete(map.size);
    map.set(((index + 1) + (index + 2)) / 2, newRow);
    let sortedMap = new Map([...map.entries()].sort(sortFunc));
    // console.log(sortedMap);
    currSts = [];

    for (const rec of sortedMap) {
        currSts.push(rec[1]);
    }
    currSts.forEach((rec, i) => {
        rec.line = i + 1;
    });
    setDK[selected].sts = currSts;
    pkTabFill('pkTable');

    $(`[class~=duration${index + 1}]`).val((start === undefined) ? 4 : (stop - start)).change();
}

// Удаление переключателя из ПК
function deleteSwitch(index) {
    let selected = $('#pkSelect').val();
    let oldData = [];
    let emptyRow = {line: 0, start: 0, num: 0, tf: 0, stop: 0, plus: false};
    let currentRow = setDK[selected].sts[index];
    const controlType = $('#tpu').val();

    if ((currentRow === undefined) || (currentRow.line === 1)) return;

    $('#pkTable tbody tr').each(function (counter) {
        oldData.push(getSelectedRowData('pkTable', 'sts', counter));
    });

    const deletedTf = oldData[index].tf;
    let isReplacementPhase = (deletedTf > 4) && (deletedTf < 8);

    if ((!isReplacementPhase) && (controlType === '1')) {
        // Для режима ЛПУ
        setDK[selected].tc -= (oldData[index].stop - oldData[index].start);
    }
    if ((deletedTf === 2) || (deletedTf === 3) || (deletedTf === 4)) {
        // Если удаляется фаза ТВП - удаляем все её Зам`ы
        let replCount = findReplacementCount(setDK[selected].sts, index);
        for (let i = index; i < (index + replCount); i++) {
            deleteSwitch(index + 1);
        }
        oldData = [];
        $('#pkTable tbody tr').each(function (counter) {
            oldData.push(getSelectedRowData('pkTable', 'sts', counter));
        });
    }

    oldData.splice(index, 1);
    oldData.push(emptyRow);
    oldData.forEach((rec, i) => {
        if (i === 0) {
            rec.num = 1;
        } else if (!checkLastLine(rec)) {
            isReplacementPhase = oldData[i].tf === 7;
            let duration = rec.stop - rec.start;
            rec.start = isReplacementPhase ? oldData[i - 1].start : oldData[i - 1].stop;
            rec.stop = rec.start + duration;
        }
        rec.line = i + 1;
    });

    setDK[selected].sts = oldData;

    pkTabFill('pkTable');

    isReplacementPhase = (deletedTf > 4) && (deletedTf < 8);
    if ((!isReplacementPhase) && (controlType === '0')) {
        // Для режима ПК
        let i = (checkLastLine(setDK[selected].sts[index])) ? 0 : index;
        let replCount = findReplacementCount(setDK[selected].sts, index);
        if ((deletedTf === 2) || (deletedTf === 3) || (deletedTf === 4)) {
            for (i = index; i < (index + replCount); i++) {
                deleteSwitch(index);
            }
            i = (checkLastLine(setDK[selected].sts[index])) ? 0 : index;
        }
        setDK[selected].sts[i].stop += (currentRow.stop - currentRow.start);
        $(`[class~=duration${i - replCount}]`)
            .val(Number($(`[class~=duration${i - replCount}]`).val()) + (currentRow.stop - currentRow.start)).change();
    }
}

// Возвращение количества переключений
function getSwitchCount(currSts) {
    let switchCount = 0;
    currSts.forEach(sw => {
        if (!checkLastLine(sw)) {
            switchCount++;
        }
    });
    return switchCount;
}

// Проверка последней линии
function checkLastLine(sw) {
    const allowZero = ['1', '8'];
    return (sw.num === 0) && ((sw.tf === 0) || (allowZero.indexOf(sw.tf) !== -1));
}

// Проверка перехода фазы
function checkTransition(currSts) {
    let retValue = [];
    currSts.forEach((sw, index) => {
        if (((sw.stop - sw.start) < 0)) {
            retValue.push(index);
        }
    });
    return retValue;
}

// Очистка признаков перехода фазы
function clearTransition(currSts) {
    currSts.forEach(sw => sw.trs = false)
}

// Добавление признаков перехода фазы
function makeTransition(currSts, index) {
    currSts[index].trs = true;
    if (((currSts[index].tf > 1) && (currSts[index].tf < 8)) && ($('#razlen').prop('checked'))) {
        currSts[index].dt = Number($(`[class~=start${index}]`).val()) + Number($(`[class~=duration${index}]`).val()) - Number($('#tc').val())
    }
}

// Очистка таблицы ПК
function resetPkTable() {
    let currSts = setDK[Number($('#pkSelect').val())].sts;
    currSts.forEach((sw, index) => {
        sw.start = 0;
        sw.num = 0;
        sw.phase = 0;
        sw.tf = 0;
        sw.stop = 0;
        sw.plus = false;
        $('[class~=start' + index + ']').val(0);
        $('[class~=tf' + index + ']').val(0);
        if (index !== 0) $('[class~=num' + index + ']').val(0);
        $('[class~=duration' + index + ']').val(0);
        $('[class~=plus' + index + ']').val('');
    });
}

// Заполнение таблицы из массивов
function pkTableValidate() {
    let currSts = setDK[Number($('#pkSelect').val())].sts;
    let cycleTime = Number($('#tc').val());
    let shift = Number($('#shift').val());

    currSts.forEach((sw, index) => {
        $('[class~=start' + index + ']').val(sw.start);
        if (shift === 0) {
            $('[class~=duration' + index + ']').val(sw.stop - sw.start);
        } else if (sw.stop === cycleTime) {
            let lastLine = !((index !== currSts.length) && (!checkLastLine(currSts[index + 1])));
            if ((sw.tf > 1) && (sw.tf < 8)) {
                $('[class~=duration' + index + ']').val((sw.stop - sw.start) + sw.dt);
            } else {
                $('[class~=duration' + index + ']').val(cycleTime - Math.abs(currSts[lastLine ? 0 : index + 1].start - sw.start));
            }
        }
    });
}

// Функция для сохранения изменений в таблице ПК
function pkTableChange(table) {
    $('#' + table).on('change', (evt) => {
        let selected = Number($('#pkSelect').val());
        let currSts = setDK[selected].sts;
        let value = Number(evt.target.value);
        let rowIndex = evt.target.parentElement.parentElement.rowIndex;
        if (rowIndex === -1) return;

        if (evt.target.className.includes('start')) {
            currSts[rowIndex - 1].start = value;
        } else if (evt.target.className.includes('tf')) {
            currSts[rowIndex - 1].tf = value;
        } else if (evt.target.className.includes('num')) {
            currSts[rowIndex - 1].num = value;
        } else if (evt.target.className.includes('plus')) {
            currSts[rowIndex - 1].plus = evt.target.value === '+';
        }
    });
    pkFlag = false;
}

// Функция для преобразования вида цифр
function handsomeNumbers(num) {
    if (num.toString().length >= 2) return num;
    return (num < 10) ? '0' + num : num;
}

// Функция для сохранения изменений всех не табличных элементов
function setChange(element, type, fullPath) {
    if (!firstLoad) return;
    let path = fullPath === undefined ? [] : fullPath.split('.');

    switch (type) {
        case 'input':
            $(`#${element}`).on('change', () => {
                setValue(path, element, $(`#${element}`).val());
            });
            break;
        case 'select':
            $(`#${element}`).on('change keyup', () => {
                setValue(path, element, $(`#${element}` + ' option:selected').val());
            });
            break;
        case 'checkbox':
            $(`#${element}`).on('change', () => {
                setValue(path, element, $(`#${element}`).prop('checked'));
            });
            break;
    }
}

// Гибкая функция для сохранения изменений
function setValue(path, element, currentValue) {
    let value = data.state;
    path.forEach(part => value = value[part]);

    // Для влкадки ПК
    if (path.some(part => part === 'SetDK')) value = value[$("#pkSelect").val()];

    value[element] = (typeof value[element] === 'number') ? Number(currentValue) : currentValue;
}

// Отображение кнопки для выбора координат и разблокирование кнопки создания нового перекрёстка
function checkNew(check) {
    let buttonClass = $('#addButton')[0].className.toString();

    if (!$('#chooseCoordinates').length) {
        $('#forCoordinates').append(
            '<div class="col-xs-8 ml-1">' +
            '<button type="button" class="btn btn-light ml-5 justify-content-center border" id="chooseCoordinates" style="">Выберите координаты</button>' +
            '</div>');
        chooseCoordinates();
        if (map !== undefined) map.setCenter([points.Y, points.X], 15);
    }

    if (/*(Number($('#id').val()) !== unmodifiedData.state.id) ||*/ (Number($('#area').val()) !== unmodifiedData.state.area) || coordinatesChangeFlag) {
        if ((buttonClass.indexOf('disabled') !== -1) && check) buttonClass = buttonClass.substring(0, buttonClass.length - 9);
    } else {
        if (buttonClass.indexOf('disabled') === -1) buttonClass = buttonClass.concat(' disabled');
    }
    $('#addButton')[0].className = buttonClass;
}

// Отображение кнопки для выбора координат и разблокирование кнопки создания нового перекрёстка
function disableControl(button, status) {
    let buttonClass = $('#' + button)[0].className.toString();
    if (status) {
        if (buttonClass.indexOf('disabled') !== -1) buttonClass = buttonClass.substring(0, buttonClass.length - 9);
    } else {
        if (buttonClass.indexOf('disabled') === -1) buttonClass = buttonClass.concat(' disabled');
    }
    $('#' + button)[0].className = buttonClass;
}

// Открытие карты с выбором координат
function chooseCoordinates() {
    $('#chooseCoordinates').on('click', () => {
        $('#mapModal').attr('style', 'display : block;');
    });

    $('.close').on('click', () => {
        $('#mapModal').attr('style', 'display : none;');
    });

    window.onclick = function (event) {
        if (event.target === $('#mapModal')) {
            $('#mapModal').attr('style', 'display : none;');
        }
    }
}

// Отправка выбранной команды на сервер
function controlSend(id) {
    ws.send(JSON.stringify({type: 'dispatch', id: id, cmd: 1, param: 0}));
}

function checkButton(buttonClass, rights) {
    if (rights) {
        if (buttonClass.indexOf('disabled') !== -1) return buttonClass.substring(0, buttonClass.length - 9);
    } else {
        if (buttonClass.indexOf('disabled') === -1) return buttonClass.concat(' disabled');
    }
    return buttonClass;
}

function checkEdit() {
    let counter = 0;
    $('a').each(function () {
        if (counter++ < 7) this.className = checkButton($(this)[0].className.toString(), editFlag);
    });
    $('#reloadButton')[0].className = checkButton($('#reloadButton')[0].className.toString(), true);
    $('#sendButton')[0].className = checkButton($('#sendButton')[0].className.toString(), false);
    $('#forceSendButton')[0].className = checkButton($('#forceSendButton')[0].className.toString(), editFlag);
    $('#addButton')[0].className = checkButton($('#addButton')[0].className.toString(), false);
}