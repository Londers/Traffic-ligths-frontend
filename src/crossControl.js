'use strict';

let data;
let unmodifiedData;
let setDK;
let daySets;
let weekSets;
let monthSets;
let stageSets;
let recentlyClicked;
let zoom;
let pkFlag = true;
let skFlag = true;
let kvFlag = true;
let firstLoad = true;
// let repaintFlag = false;

let map;

const numberFlag = true;
const longPathFlag = true;
let coordinatesChangeFlag = false;

const mainTableFlag = true;
const skTableFlag = true;
const nkTableFlag = false;
const gkTableFlag = false;
const vvTableFlag = false;
const vv2TableFlag = true;
const kvTableFlag = false;

let tempIndex;
let copyArray = [];
let points = {
    Y: 0,
    X: 0
};

let editFlag = false;
let ws;

//Получение информации из выбранной строки
function getSelectedRowData(table, fullPath, force) {
//    let forceRow = force;
    let index = (force === undefined) ? $('#' + table).find('tr.success').data('index') : force;
    if (force === undefined) tempIndex = index;
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

//Выделение выбранной строки
function colorizeSelectedRow(table) {
    let index = $('#' + table).find('tr.success').data('index');

    let counter = 0;
    $('#' + table).find('tbody').find('tr').each(function () {
        if (counter === index) {
            $(this).find('td').each(function () {
//                if($(this).attr('style') ===  'background-color: #cccccc') {
//                    $(this).attr('style', '');
//                } else {
                $(this).attr('style', 'background-color: #cccccc')
//                }
            })
        }
        if (counter++ !== index) {
            $(this).find('td').each(function () {
                $(this).attr('style', '')
            })
        }
    });
}

$(() => {
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
                    disableControl('forceSendButton', true);
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
            case 'checkB':
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

//Функционал кнопок управления
    //Кнопка для отпрвления данных на сервер
    $('#sendButton').on('click', () => {
        data.state.dgis = points.Y + ',' + points.X;
        // prepareVVTab();
        prepareDaySets();
        if (data.state.area === unmodifiedData.state.area) {
            ws.send(JSON.stringify({type: 'sendB', state: data.state, rePaint: coordinatesChangeFlag, z: zoom}));
        } else {
            ws.send(JSON.stringify({type: 'createB', state: data.state}));
        }
    });

    //Заполнение 3х массивов для ЮВ (useinput, pointset, defstatis)
    function prepareVVTab() {
        let tableData = $('#vvTable').bootstrapTable('getData');
        let statCount = 0;
        let shift1 = tableData.shift();
        let shift2 = tableData.shift();
        tableData.push(shift1);
        tableData.push(shift2);

        data.state.arrays.useinput.used = [];
        data.state.arrays.pointset.pts = [];

        for (let rec in tableData) {
            data.state.arrays.useinput.used.push(false);
        }
        for (let i = 0; i < tableData.length; i++) {
            if (tableData[i].type !== 0) data.state.arrays.pointset.pts.push({num: i + 1, typst: tableData[i].type});
        }

        tableData.forEach((rec, index) => {
            data.state.arrays.useinput.used[index] = (rec.type !== 0);
            if ((rec.type !== 0) && (rec.type < 8)) {
                data.state.arrays.pointset.pts[index].num = index + 1;
                data.state.arrays.pointset.pts[index].typst = rec.type;
            }
            if (statCount < rec.type) statCount = rec.type;
        });
        data.state.arrays.defstatis.lvs[0].typst = statCount;
        data.state.arrays.defstatis.lvs[0].ninput = tableData.length;
        data.state.arrays.defstatis.lvs[0].count = 0;
    }

    //Заполнение переменной count в суточных картах
    function prepareDaySets() {
        daySets.forEach(daySet => {
            let index = 0;
            daySet.lines.forEach(line => {
                if (line.npk !== 0) index++;
            });
            daySet.count = index;
        });
    }

    //Кнопка для создания нового перекрёстка
    $('#addButton').on('click', () => {
        data.state.dgis = points.Y + ',' + points.X;
        ws.send(JSON.stringify({type: 'createB', state: data.state, z: zoom}));
    });

    //Кнопка для обновления данных на АРМе
    $('#reloadButton').on('click', () => {
        ws.send(JSON.stringify({type: 'updateB'}));
    });

    //Кнопка для удаления перекрёстка
    $('#deleteButton').on('click', () => {
        if (confirm('Вы уверены? Перекрёсток будет безвозвратно удалён.')) {
            ws.send(JSON.stringify({
                type: 'deleteB',
                state: data.state
            }));
        }
    });

    //Кнопка для проверки возможности редактирования перекрестка
    $('#checkEdit').on('click', () => {
        ws.send(JSON.stringify({type: 'editInfoB'}));
    });

    //Кнопка для проверки валидности заполненных данных
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
    //Функционирование кнопки с выводом информации о проверке
    $(".trigger").on('click', () => {
        $(".panel").toggle("fast");
        $(this).toggleClass("active");
        return false;
    });

//Функционал кнопок на вкладке "Основные"
    //Кнопка для возвращения исходных данных
    $('#mainReloadButton').on('click', () => {
        mainTabFill(unmodifiedData, false);
    });

//Функционал кнопок на вкладке "ПК"
    //Кнопка для копирования строки
    $('#pkCopyButton').on('click', () => {
        let selected = $('#pkSelect').val();
        copyArray = Object.assign({}, setDK[selected]);
    });

    //Кнопка для перезаписи строки
    $('#pkPasteButton').on('click', () => {
        let selected = $('#pkSelect').val();
        setDK[selected] = Object.assign({}, copyArray);
        pkTabFill('pkTable');
    });

    //Кнопка для возвращения исходных данных
    $('#pkReloadButton').on('click', () => {
        pkTabFill2(unmodifiedData, false);
    });

    //Кнопка для обнуления текущего ПК
    $('#pkNewButton').on('click', () => {
        let selected = $('#pkSelect').val();
        setDK[selected].sts.forEach(row => {
            row.num = 0;
            row.start = 0;
            row.stop = 0;
            row.tf = 0;
            row.plus = false;
        });
        pkTabFill2(data, false);
    });

    //Кнопка для копирования всей информации выбранного ПК
    $('#switchCopy').on('click', () => {
        let index = $('#pkTable').find('tr.success').data('index');

        function sortFunc(a, b) {
            return a[0] - b[0];
        }

        let selected = $('#pkSelect').val();
        if (index === undefined) index = 0;
        let tf = Number($('#tf').val());
        let currSts = setDK[selected].sts;
        let newRow = {
            line: index, start: currSts[(index === 0) ? 11 : (index)].stop, num: 1, tf: tf,
            stop: currSts[(index === 0) ? 11 : (index)].stop, plus: $('#razlen').prop('checked')
        };
        let map = new Map();
        currSts.forEach((sts, i) => {
            map.set(sts.line, sts);
        });
        map.delete(map.size - 1);
        map.set(((index + 1) + (index + 2)) / 2, newRow);
        let sortedMap = new Map([...map.entries()].sort(sortFunc));
        console.log(sortedMap);
        currSts = [];

        for (const rec of sortedMap) {
            currSts.push(rec[1]);
        }
        currSts.forEach((rec, i) => {
            rec.line = i + 1;
        });
        setDK[selected].sts = currSts;
        pkTabFill('pkTable');
        // currSts.pop();


        // let selectVal = 0;
        // let oldData = [];
        // let counter = 0;
        //
        // if (getSelectedRowData('pkTable', 'sts') === undefined) return;
        //
        // $('#pkTable tbody tr').each(function() {
        //     oldData.push(getSelectedRowData('pkTable', 'sts', counter));
        //     // });
        //     // counter = 0;
        //     // $('#pkTable tbody tr').each(function() {
        //     if (counter++ === index) {
        //         let selectPosition = 0;
        //         $(this).find('td').each(function() {
        //             if (selectPosition++ === 2) selectVal = $(this).find('select').children("option:selected").val();
        //         })
        //     }
        // });
        // counter = 0;
        // oldData.splice(index, 0, JSON.parse(JSON.stringify(oldData[index])));
        // oldData.pop();
        // oldData.forEach(rec => {
        //     rec.line = ++counter;
        // });
        //
        // oldData[index].tf = Number(selectVal);
        // oldData[index + 1].tf = Number(selectVal);
        // setDK[selected].sts = oldData;
        //
        // pkTabFill('pkTable');
    });

    //Кнопка для перезаписи всей информации выбранного ПК
    $('#switchDel').on('click', () => {
        let index = $('#pkTable').find('tr.success').data('index');
        let selected = $('#pkSelect').val();
        let oldData = [];
        let counter = 0;
        let emptyRow = {line: 0, start: 0, num: 0, tf: 0, stop: 0, plus: false};

        if (getSelectedRowData('pkTable', 'sts') === undefined) return;

        $('#pkTable tbody tr').each(function () {
            oldData.push(getSelectedRowData('pkTable', 'sts', counter++));
        });

        oldData.splice(index, 1);
        oldData.push(emptyRow);
        oldData.forEach((rec, i) => {
            rec.line = i + 1;
        });

        setDK[selected].sts = oldData;

        pkTabFill('pkTable');
    });

//Функционал кнопок на вкладке "Сут. карты"
    //Кнопка для добавления новой строки
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

    //Кнопка для удаления строки
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

    //Кнопка для копирования суточной карты
    $('#skCopyButton').on('click', () => {
        let selected = $('#mapNum').val();
        copyArray = Object.assign({}, daySets[selected]);
    });

    //Кнопка для перезаписи суточной карты
    $('#skPasteButton').on('click', () => {
        let selected = $('#mapNum').val();
        daySets[selected] = Object.assign({}, copyArray);
        newTableFill('skTable', skTableFlag);
    });

    //Кнопка для загрузки исходных данных
    $('#skReloadButton').on('click', () => {
        skTabFill(unmodifiedData, false);
    });

    //Кнопка для обнуления текущей карты
    $('#skNewButton').on('click', () => {
        let selected = $('#mapNum').val();
        data.state.arrays.DaySets.daysets[selected].lines.forEach(row => {
            row.npk = 0;
            row.hour = 0;
            row.min = 0;
        });
        skTabFill(data, false);
    });

//Функционал кнопок на вкладке "Нед. карты"
    //Кнопка для копирования строки
    $('#nkCopyButton').on('click', () => {
        copyArray = getSelectedRowData('nkTable', 'days').slice();
    });

    //Кнопка для перезаписи строки
    $('#nkPasteButton').on('click', () => {
        let index = $('#nkTable').find('tr.success').data('index');
        if (getSelectedRowData('nkTable', 'days') === undefined) return;
        weekSets[index].days = copyArray.slice();
        tableFill(weekSets, 'nkTable', nkTableFlag);
    });

    //Кнопка для загрузки исходных данных
    $('#nkReloadButton').on('click', () => {
        nkTabFill(unmodifiedData);
    });

//Функционал кнопок на вкладке "Карта года"
    //Кнопка для копирования строки
    $('#gkCopyButton').on('click', () => {
        copyArray = getSelectedRowData('gkTable', 'days').slice();
    });

    //Кнопка для перезаписи строки
    $('#gkPasteButton').on('click', () => {
        let index = $('#gkTable').find('tr.success').data('index');
        if (getSelectedRowData('gkTable', 'days') === undefined) return;
        monthSets[index].days = copyArray.slice();
        tableFill(monthSets, 'gkTable', gkTableFlag);
    });

    //Кнопка для загрузки исходных данных
    $('#gkReloadButton').on('click', () => {
        gkTabFill(unmodifiedData);
    });

//Функционал кнопок на вкладке "Контроль входов"

    //Кнопка для копирования строки
    $('#kvCopyButton').on('click', () => {
        copyArray = Object.assign({}, getSelectedRowData('kvTable'));
    });

    //Кнопка для перезаписи строки
    $('#kvPasteButton').on('click', () => {
        let index = $('#kvTable').find('tr.success').data('index');
        if (getSelectedRowData('kvTable') === undefined) return;
        stageSets[index] = Object.assign({}, copyArray);
        newTableFill('kvTable', kvTableFlag);
    });

    //Кнопка для загрузки исходных данных
    $('#kvReloadButton').on('click', () => {
        kvTabFill(unmodifiedData);
    });

    //Выбор строк в таблицах по клику
    $('#pkTable').on('click-row.bs.table', function (e, row, $element) {
        $('.success').removeClass('success');
        $($element).addClass('success');
        colorizeSelectedRow('pkTable');
    });
    $('#skTable').on('click-row.bs.table', function (e, row, $element) {
        $('.success').removeClass('success');
        $($element).addClass('success');
        colorizeSelectedRow('skTable');
    });
    $('#nkTable').on('click-row.bs.table', function (e, row, $element) {
        $('.success').removeClass('success');
        $($element).addClass('success');
        colorizeSelectedRow('nkTable');
    });
    $('#gkTable').on('click-row.bs.table', function (e, row, $element) {
        $('.success').removeClass('success');
        $($element).addClass('success');
        colorizeSelectedRow('gkTable');
    });
    $('#kvTable').on('click-row.bs.table', function (e, row, $element) {
        $('.success').removeClass('success');
        $($element).addClass('success');
        colorizeSelectedRow('kvTable');
    });

    //Функционирование выбора СК и ПК
    $('#mapNum').on('change keyup', () => {
        newTableFill('skTable', skTableFlag);
    });

    $('#pkSelect').on('change keyup', () => {
        pkTabFill('pkTable');
    });

    // let x = undefined, y = undefined;

    //Функционирование карты для выбора координат
    ymaps.ready(() => {
        //Создание и первичная настройка карты
        map = new ymaps.Map('map', {
            center: [points.Y, points.X],
            zoom: 15
        });
        console.log(points);
        map.events.add(['wheel', 'mousemove'], function (e) {
            zoom = map._zoom;
        });
        // $('#map').on('click', function (event) {
        //     // x = event.clientX;
        //     // y = event.clientY;
        //     zoom = map._zoom;
        //     let coords = event.get('coords');
        //     points.Y = coords[0].toPrecision(9);
        //     points.X = coords[1].toPrecision(9);
        //     map.setCenter([points.Y, points.X], zoom);
        //     console('center', [points.Y, points.X]);
        //     console('minus', map.converter.clientPixelsToCoordinates(new YMaps.Point(-225, -225)));
        //     console('plus', map.converter.clientPixelsToCoordinates(new YMaps.Point(225, 225)));
        // });


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
        })
    });
});

//Набор функций корректной работы АРМ

//Функция для загрузки данных с сервера
function loadData(newData, firstLoadFlag) {

    // console.log(newData);
    let coords = newData.state.dgis;
    points.Y = coords.substring(0, coords.indexOf(','));
    points.X = coords.substring(coords.indexOf(',') + 1, coords.length);
    data = newData;
    unmodifiedData = JSON.parse(JSON.stringify(data));

    checkNew();

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
            disableControl('forceSendButton', false);
        });
    }

    //Основная вкладка
    mainTabFill(data, firstLoadFlag);

    //Вкладка ПК
    pkTabFill2(data, firstLoadFlag);

    //Вкладка сут. карт
    skTabFill(data, firstLoadFlag);

    //Вкладка нед. карт
    nkTabFill(data);

    //Вкладка карт года
    gkTabFill(data);

    //Вкладка внеш. входов
    vvTabFill(firstLoadFlag);

    //Зануление второго элемента массива (так надо)
    for (const [key] of Object.entries(data.state.arrays.defstatis.lvs[1])) {
        data.state.arrays.defstatis.lvs[1][key] = 0;
    }

    //Вкладка контроля входов
    kvTabFill();

    setIDs();

    $('td > input').on('click', function (element) {
        recentlyClicked = Number(element.target.id);
    });

    $('input').each(function () {
        $(this).on('click', () => {
            disableUnchecked();
        });
        $(this).on('keypress', () => {
            disableUnchecked();
        })
    });
    $('select').each(function () {
        $(this).on('click', () => {
            disableUnchecked();
        });
        $(this).on('keypress', () => {
            disableUnchecked();
        })
    });
}

//Отключает функционал некоторых кнопок, если данные не проверены
function disableUnchecked() {
    disableControl('sendButton', false);
    disableControl('forceSendButton', false);
    disableControl('addButton', false);
}

function setIDs(table) {
    if (table === undefined) {
        table = document;
    } else {
        table = $('#nav-tab').find('a[aria-selected=true]')[0].id;
    }
    let counter = 0;
    $(table).find('table').each(function () {
        $(this).find('tbody').find('tr').each(function () {
            $(this).find('td').each(function () {
                $(this).find('input').each(function () {
                    $($(this)[0]).attr('id', counter++);
                    $(this).on('keydown', function (event) {
                        handleKeyboard(event);
                    });
                });
            });
        });
    });
}

function handleKeyboard(key) {
    let tab = $('#nav-tab').find('a[aria-selected=true]')[0].id;
    let retValue;
    switch (key["which"]) {
        case 37: // left
            if (boundsCalc(tab, Number(recentlyClicked), 'left').ret) return;
            $('#' + (Number(recentlyClicked) - 1).toString()).focus();
            recentlyClicked -= 1;
            break;

        case 38: // up
            retValue = boundsCalc(tab, Number(recentlyClicked), 'up');
            if (retValue.ret) return;
            $('#' + (Number(recentlyClicked) - retValue.shift).toString()).focus();
            recentlyClicked -= retValue.shift;
            break;

        case 9:
        case 13:
        case 39: // right
            if (boundsCalc(tab, Number(recentlyClicked), 'right').ret) return;
            $('#' + (Number(recentlyClicked) + 1).toString()).focus();
            recentlyClicked = Number(recentlyClicked) + 1;
            break;

        case 40: // down
            retValue = boundsCalc(tab, Number(recentlyClicked), 'down');
            if (retValue.ret) return;
            $('#' + (Number(recentlyClicked) + retValue.shift).toString()).focus();
            recentlyClicked = Number(recentlyClicked) + retValue.shift;
            break;

        default:
            return; // exit this handler for other keys
    }
    key.preventDefault();
}

function boundsCalc(tab, clicked, key) {
    let retValue = {ret: true, shift: 0};
    let min;
    let max;
    switch (tab) {
        case 'nav-main-tab':
            if (key === 'left') (clicked === 0) ? retValue.ret = true : retValue.ret = false;
            if (key === 'right') (clicked === 5) ? retValue.ret = true : retValue.ret = false;
            break;
        case 'nav-pk-tab':
            if (key === 'left') (clicked === 6) ? retValue.ret = true : retValue.ret = false;
            if (key === 'right') (clicked === 53) ? retValue.ret = true : retValue.ret = false;
            if (key === 'up') {
                if ((clicked > 9)) {
                    retValue.ret = false;
                    retValue.shift = 4;
                }
            }
            if (key === 'down') {
                if ((clicked < 50)) {
                    retValue.ret = false;
                    retValue.shift = 4;
                }
            }
            break;
        case 'nav-sk-tab':
            if (key === 'left') (clicked === 54) ? retValue.ret = true : retValue.ret = false;
            if (key === 'right') (clicked === 89) ? retValue.ret = true : retValue.ret = false;
            if (key === 'up') {
                if ((clicked > 56)) {
                    retValue.ret = false;
                    retValue.shift = 3;
                }
            }
            if (key === 'down') {
                if ((clicked < 87)) {
                    retValue.ret = false;
                    retValue.shift = 3;
                }
            }
            break;
        case 'nav-nk-tab':
            if (key === 'left') (clicked === 90) ? retValue.ret = true : retValue.ret = false;
            if (key === 'right') (clicked === 173) ? retValue.ret = true : retValue.ret = false;
            if (key === 'up') {
                if ((clicked > 96)) {
                    retValue.ret = false;
                    retValue.shift = 7;
                }
            }
            if (key === 'down') {
                if ((clicked < 167)) {
                    retValue.ret = false;
                    retValue.shift = 7;
                }
            }
            break;
        case 'nav-gk-tab':
            if (key === 'left') (clicked === 174) ? retValue.ret = true : retValue.ret = false;
            if (key === 'right') (clicked === 545) ? retValue.ret = true : retValue.ret = false;
            if (key === 'up') {
                if ((clicked > 204)) {
                    retValue.ret = false;
                    retValue.shift = 31;
                }
            }
            if (key === 'down') {
                if ((clicked < 515)) {
                    retValue.ret = false;
                    retValue.shift = 31;
                }
            }
            break;
        case 'nav-vv-tab':
            max = 586;
            if (data.state.arrays.SetTimeUse.uses.length === 8) {
                max += 40;
            }
            if (key === 'left') (clicked === 546) ? retValue.ret = true : retValue.ret = false;
            if (key === 'right') (clicked === 643) ? retValue.ret = true : retValue.ret = false;
            if (key === 'up') {
                if ((clicked > 550)) {
                    retValue.ret = false;
                    retValue.shift = 5;
                }
            }
            if (key === 'down') {
                if ((clicked < max)) {//626
                    retValue.ret = false;
                    retValue.shift = 5;
                }
            }
            break;
        case 'nav-kv-tab':
            min = 597;
            max = 622;
            if (data.state.arrays.SetTimeUse.uses.length === 8) {
                min += 40;
                max += 40;
            }
            if (key === 'left') (clicked === 644) ? retValue.ret = true : retValue.ret = false;
            if (key === 'right') (clicked === 675) ? retValue.ret = true : retValue.ret = false;
            if (key === 'up') {
                if ((clicked > min)) {//637
                    retValue.ret = false;
                    retValue.shift = 4;
                }
            }
            if (key === 'down') {
                if ((clicked < max)) {//662
                    retValue.ret = false;
                    retValue.shift = 4;
                }
            }
            break;
    }
    return retValue;
}

//Заполнение вкладки "Основные"
function mainTabFill(data, firstLoadFlag) {
    for (let area in data.areaMap) {
        if (firstLoadFlag) $('#area').append(new Option(data.areaMap[area], area));
    }
    $('#id').val(data.state.id).on('change', () => {
        if ($('#id').val() > 255) $('#id').val(255);
        checkNew(false);
    });
    setChange('id', 'input', '', numberFlag);
    setChange('idevice', 'input', '', numberFlag);
    $('#idevice').val(data.state.idevice).on('change', () => {
        checkNew(false);
    });
    setChange('area', 'select', '');
    $('#area option[value=' + data.state.area + ']').attr('selected', 'selected');
    setChange('type', 'select', 'arrays');
    $('#type option[value=' + data.state.arrays.type + ']').attr('selected', 'selected');
    $('#subarea').val(data.state.subarea);
    setChange('subarea', 'input', '', numberFlag);
    $('#name').val(data.state.name);
    setChange('name', 'input', '', !numberFlag);
    $('#phone').val(data.state.phone);
    setChange('phone', 'input', '', !numberFlag);
    $('#ip')[0].innerText = 'IP: ' + data.deviceIP;
    $('#tz').val(data.state.arrays.timedev.tz);
    setChange('tz', 'input', 'arrays.timedev', numberFlag, null, true);
    $('#summer').prop('checked', data.state.arrays.timedev.summer);
    setChange('summer', 'checkbox', 'arrays.timedev', !numberFlag, !longPathFlag);

    $('#vpcpd').val((parseFloat(data.state.Model.vpcpdl + '.' + data.state.Model.vpcpdr) <= 12.3) ? 12.3 : 12.4);
    Number($('#vpcpd').val()) <= 12.3 ?
        sizeVerification(8) :
        sizeVerification(16);
    $('#vpcpd').on('change keyup', () => {
        let ver = $('#vpcpd option:selected').val().split('.');
        data.state.Model.vpcpdl = Number(ver[0]);
        data.state.Model.vpcpdr = Number(ver[1]);
    });

    $('#vpbsl').val(data.state.Model.vpbsl);
    setChange('vpbsl', 'input', 'Model', numberFlag);
    $('#vpbsr').val(data.state.Model.vpbsr);
    setChange('vpbsr', 'input', 'Model', numberFlag);

    anotherTableFill('table', mainTableFlag);
}

function sizeVerification(length) {
    let vvTable = data.state.arrays.SetTimeUse.uses;
    let emptyRecord = {
        'dk': 0,
        'fazes': 0,
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
    for (let i = 2; i < length; i++) {
        vvTable[i].name = (i - 1) + ' вх';
    }
}

//Заполнение вкладки "ПК"
function pkTabFill2(newData, firstLoadFlag) {
    setDK = JSON.parse(JSON.stringify(newData)).state.arrays.SetDK.dk;

    if (firstLoadFlag) {
        setChange('tc', 'input', 'arrays.SetDK.dk', numberFlag, longPathFlag);
        setChange('twot', 'checkbox', 'arrays.SetDK.dk', !numberFlag, longPathFlag);
        setChange('shift', 'input', 'arrays.SetDK.dk', numberFlag, longPathFlag);
        setChange('tpu', 'select', 'arrays.SetDK.dk', !numberFlag, longPathFlag);
        setChange('razlen', 'checkbox', 'arrays.SetDK.dk', !numberFlag, longPathFlag);
        setChange('desc', 'input', 'arrays.SetDK.dk', !numberFlag, longPathFlag);
    }
    pkTabFill('pkTable');
}

//Заполнение вкладки "Сут. карты"
function skTabFill(newData, firstLoadFlag) {
    daySets = newData.state.arrays.DaySets.daysets;
    daySets.forEach(daySet => {
        if (firstLoadFlag) $('#mapNum').append(new Option(daySet.num, daySet.num - 1));
    });
    newTableFill('skTable', skTableFlag);
}

//Заполнение вкладки "Нед. карты"
function nkTabFill(newData) {
    weekSets = newData.state.arrays.WeekSets.wsets;
    tableFill(weekSets, 'nkTable', nkTableFlag);
}

//Заполнение вкладки "Карты года"
function gkTabFill(newData) {
    monthSets = newData.state.arrays.MonthSets.monthset;
    tableFill(monthSets, 'gkTable', gkTableFlag);
}

//Заполнение вкладки "Внеш. входы"
function vvTabFill(firstLoadFlag) {
    anotherTableFill('vvTable', vvTableFlag);

    $('#ite').val(data.state.arrays.SetTimeUse.ite);
    if (firstLoadFlag) setChange('ite', 'input', 'arrays.SetTimeUse', numberFlag);
    $('#tuin').val(data.state.arrays.defstatis.lvs[0].period);
    if (firstLoadFlag) {
        $('#tuin').on('change', () => {
            data.state.arrays.defstatis.lvs[0].period = Number($('#tuin').val());
        });
    }
    // setChange('tuin', 'input', 'arrays.SetTimeUse', numberFlag);

    tableFill([0], 'vv2Table', vv2TableFlag);
}

//Заполнение вкладки "Контроль входов"
function kvTabFill() {
    stageSets = data.state.arrays.SetCtrl.Stage;
    newTableFill('kvTable', kvTableFlag);
}


//Функция для заполнения таблиц недельных карт, годовых карт и длительности МГР при неисправности ДТ
function tableFill(set, table, staticFlag) {
    $('#' + table).bootstrapTable('removeAll');
    set.forEach(function () {
        $('#' + table).bootstrapTable('append', '');
    });

    let counter = -1;
    $('#' + table + ' tbody tr').each(function () {
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

    $('#' + table + ' thead tr th').each(function () {
        $(this).attr('style', 'text-align: center; min-width: 45px;')
    });

    if (firstLoad) tableChange(set, table, !staticFlag);
}

//Функция для сохранения изменений в вышеперечисленных таблицах
function tableChange(set, table, daysFlag) {
    $('#' + table).on('change', () => {
        let counter = 0;
        $('#' + table + ' tbody tr').each(function () {
            let setArr = [];
            $(this).find('td').each(function () {
                let value = Number($(this).find('input').val());
                if (!isNaN(value)) setArr.push(value);
            });
            (daysFlag) ? set[counter++].days = setArr : data.state.arrays.SetTimeUse.notwork = setArr;
        });
        console.log(data.state);
    })
}

//Функция для заполнения таблиц параметров ДК и использования внешних входов
function anotherTableFill(table, tableFlag) {
    $('#' + table).bootstrapTable('removeAll')
        .bootstrapTable('append', (tableFlag ? data.state.arrays.SetupDK : data.state.arrays.SetTimeUse.uses));
    $('#' + table + ' tbody tr').each(function () {
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

//Функция для сохранения изменений в вышеперечисленных таблицах
function anotherTableChange(table, tableFlag) {
    $('#' + table).on('change', () => {
        let names = [];
        $('#' + table + ' thead th').each(function () {
            names.push($(this).attr('data-field'));
        });
        let recCounter = 0;
        $('#' + table + ' tbody tr').each(function () {
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

//Функция для заполнения таблиц суточных карт и контроля входов
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
    $('#' + table + ' tbody tr').each(function () {
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
                case 0 :
                    $(this).append(counter + 1);
                    break;
                case 1 :
                    if (endFlag) {
                        $(this.append('00:00'));
                    } else {
                        $(this).append(((counter === 0) ? '00' : handsomeNumbers((tableFlag ? prevArr.hour : prevArr.end.hour))) + ':' +
                            ((counter === 0) ? '00' : handsomeNumbers((tableFlag ? prevArr.min : prevArr.end.min))));
                    }
                    break;
                case 2 :
                    $(this).append(
                        '<div class="container"><div class="row"><input class="form-control border-0 col-md-5" ' +
                        'style="max-width: 45px;" name="number" type="number" value="' +
                        handsomeNumbers((tableFlag ? currArr.hour : currArr.end.hour)) + '" required/> ' + '<div style="margin-top: 6px;">:</div>' +
                        '<input class="form-control border-0 col-md-5" style="max-width: 45px;" name="number" ' +
                        'type="number" value="' + handsomeNumbers((tableFlag ? currArr.min : currArr.end.min)) +
                        '" required/></div></div>'
                    );
                    break;
                case 3 :
                    $(this).append(
                        '<input class="form-control border-0" name="number" type="number" ' +
                        'style="max-width: 50px;" value="' + (tableFlag ? currArr.npk : currArr.lenTVP) + '"/>'
                    );
                    break;
                case 4 :
                    $(this).append(
                        '<input class="form-control border-0" name="number" type="number" ' +
                        'style="max-width: 50px;" value="' + currArr.lenMGR + '"/>'
                    );
                    break;
            }
        });
    });
}

//Функция для сохранения изменений в таблице суточных карт, а также заполнение столбца "T начала"
function skTableChange(table) {
    $('#' + table).on('change', () => {
        let selected = $('#mapNum').val();
        let tableData = [];
        $('#' + table + ' tbody tr').each(function () {
            let rec = [];
            $(this).find('td').each(function () {
                $(this).find('input').each(function () {
                    let value = $(this).val();
                    rec.push(Number((value.startsWith('0')) ? value.substring(1, 2) : value));
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
        console.log(data.state);
    });
    skFlag = false;
}

//Функция для сохранения изменений в таблице контроля входов, а также заполнение столбца "T начала"
function kvTableChange(table) {
    $('#' + table).on('change', () => {
        let tableData = [];
        $('#' + table + ' tbody tr').each(function () {
            let rec = [];
            $(this).find('td').each(function () {
                let text = $(this)[0].innerText;
                if ((text !== ':') && (text !== '')) {
                    if (text.includes(':')) {
                        let time = text.split(':');
                        rec.push(Number(time[0]));
                        rec.push(Number(time[1]));
                    } else {
                        rec.push(Number(text));
                    }
                }
                $(this).find('input').each(function () {
                    let value = $(this).val();
                    rec.push(Number(((value.startsWith('0')) && (value.length > 1)) ? value.substring(1, 2) : value));
                })
            });
            tableData.push(rec);
        });
        let counter = 0;
        stageSets.forEach(variable => {
            variable.line = tableData[counter][0];
            variable.start.hour = tableData[counter][1];
            variable.start.min = tableData[counter][2];
            variable.end.hour = tableData[counter][3];
            variable.end.min = tableData[counter][4];
            variable.lenTVP = tableData[counter][5];
            variable.lenMGR = tableData[counter++][6];
        });
        data.state.arrays.SetCtrl.Stage = stageSets;
        newTableFill(table, false);
        console.log(data.state);
    });
    kvFlag = false;
}

//Функция для заполнения вкладки ПК
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
    $('#shift').val(currPK.shift);
    $('#tpu').find('option').each(function () {
        $(this).removeAttr('selected');
    });
    $('#tpu option[value="' + currPK.tpu + '"]').attr('selected', 'selected');
    $('#razlen').prop('checked', currPK.razlen);
    $('#desc').val(currPK.desc);

    currPK.sts.forEach(function () {
        $('#' + table).bootstrapTable('append', '');
    });

    function pkTableDurationFunctional() {
        // let $table = $('#pkTable');
        // let cycleTime = Number($('#tc').val()) - Number($('#shift').val());
        // let shift = $('#shift').val();
        let difLen = $('#razlen').prop('checked');
        // let helpArray = ['start', 'tf', 'num', 'duration', 'plus'];
        // let helpMap = {start: true, tf: true, num: true, duration: true, plus: true};

        currPK.sts.forEach(function (row, index) {
            let disabledStatusMap = {start: true, tf: true, num: true, duration: true, plus: true};

            if (index === 0) {
                disabledStatusMap.duration = false;
            } else if ((index < (currPK.sts.length - 1)) && (($('[class~=num' + index + ']').val() !== '0') || ($('[class~=tf' + index + ']').val() !== '0'))) {
                disabledStatusMap.num = false;
                disabledStatusMap.tf = false;
                disabledStatusMap.duration = false;
            }

            disabledStatusMap.plus = !difLen;

            for (const [key, value] of Object.entries(disabledStatusMap)) {
                $('[class~=' + key + index + ']')[0].disabled = value;
            }

        });

        if (firstLoad) {
            $('#tc').on('change', () => {
                let currSts = setDK[Number($('#pkSelect').val())].sts;
                let shift = Number($('#shift').val());
                let cycleTime = Number($('#tc').val());

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

                if ((cycleTime + shift) >= 256) {
                    cycleTime = 255 - shift;
                    $('#tc').val(cycleTime);
                    setDK[selected].tc = cycleTime;
                }

                //Для особых режимов таблица не нужна
                if (cycleTime < 3) {
                    resetPkTable();
                    $('#' + table).hide();
                    return;
                }

                $('#' + table).show();

                savePkTable();

                currSts.forEach((line) => {
                    cycleTime -= (line.stop - line.start);
                });

                let successCheck = false;
                $('#' + table + ' tbody tr').each(function (index) {
                    if (this.className === 'success') {
                        successCheck = true;
                        let $this = $('[class~=duration' + index + ']');
                        let currSts = setDK[Number($('#pkSelect').val())].sts;
                        let lastLine = ((currSts[index + 1].num === 0) && (currSts[index + 1].tf === 0));
                        $this.val(Number($this.val()) + cycleTime);
                        currSts[index].stop += cycleTime;

                        if (!lastLine) {
                            $('[class~=duration' + (index) + ']').val(currSts[index].stop - currSts[index].start);
                            $('[class~=start' + (index) + ']').val(currSts[index].stop);
                            for (let i = index; i < currSts.length; i++) {
                                $('[class~=start' + i + ']').val(currSts[(i === 0) ? index : (i - 1)].stop);
                                currSts[i].stop = Number($('[class~=start' + i + ']').val()) + Number($('[class~=duration' + i + ']').val());
                                currSts[i].start = currSts[i].stop - Number($('[class~=duration' + i + ']').val());
                                if ((i !== (currSts.length - 1)) && ((currSts[i + 1].num === 0) && (currSts[i + 1].tf === 0))) {
                                    $('[class~=duration' + (index) + ']').change();
                                    return;
                                }
                            }
                        } else {
                            currSts[index].stop = Number($('#tc').val()) + Number($('#shift').val());
                        }
                    }
                });
                if (successCheck) {

                }
            });

            $('#shift').on('change keyup', (event) => {
                if ((event.type === 'keyup') && (event.originalEvent.code !== 'Enter')) return;

                let shift = Number($('#shift').val());
                let cycleTime = Number($('#tc').val());
                if ((cycleTime + shift) >= 256) {
                    shift = 255 - cycleTime;
                    $('#shift').val(shift);
                    data.state.arrays.SetDK[selected].shift = shift;
                }

                let currSts = setDK[Number($('#pkSelect').val())].sts;
                let shiftDiff = shift - $('[class~=start0]').val();
                let shiftFlag = (shiftDiff < 0);
                shiftDiff = Math.abs(shiftDiff);

                for (let i = 0; i < 12; i++) {
                    if (($('[class~=num' + i + ']').val() !== '0') || ($('[class~=tf' + i + ']').val() !== '0')) {
                        currSts[i].start += (shiftFlag ? -shiftDiff : shiftDiff);
                        if (currSts[i].start >= cycleTime) currSts[i].start -= cycleTime;
                        currSts[i].stop += (shiftFlag ? -shiftDiff : shiftDiff);
                        $('[class~=start' + i + ']').val(currSts[i].start);
                        $('[class~=stop' + i + ']').val(currSts[i].stop);
                    }
                }
            });

            $('#razlen').on('change', () => {
                currPK.sts.forEach(function (row, index) {
                    if (index !== 11) $('[class~=plus' + index + ']')[0].disabled = !$('#razlen').prop('checked');
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

    $('#' + table + ' tbody tr').each(function (index) {
        $(this).find('td').each(function (switchIndex) {
            let record = currPK.sts[index];
            switch (switchIndex) {
                case 0 :
                    $(this).append(record.line);
                    break;
                case 1 :
                    $(this).append(
                        '<input class="form-control border-0 start' + index + '" name="number" type="number"' +
                        'style="max-width: 55px;" value="' + record.start + '"/>'
                    );
                    break;
                case 2 :
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
                    $(this).find('option[value="' + record.tf + '"]').attr('selected', 'selected');
                    break;
                case 3 :
                    $(this).append(
                        '<input class="form-control border-0 num' + index + '" name="number" type="number"' +
                        'style="max-width: 55px;" value="' + record.num + '"/>'
                    );
                    break;
                case 4 :
                    $(this).attr('class', 'justify-content-center');
                    $(this).append(
                        '<input class="form-control border-0 duration' + index + '" name="number" type="number"' +
                        'style="max-width: 55px;" value="' + ((tableType) ? (record.stop - record.start) : record.stop) + '"/>'
                    );
                    $(this).find('input').on('keyup change', (event) => {
                        if ((event.type === 'keyup') && (event.originalEvent.code !== 'Enter')) return;
                        let $this = $(this).find('input');
                        let cycleTime = Number($('#tc').val());
                        let currSts = setDK[Number($('#pkSelect').val())].sts;
                        let lastLine = ((currSts[index + 1].num === 0) && (currSts[index + 1].tf === 0));
                        // let lastLine = -1;
                        currSts[index].stop = Number(currSts[index].start) + Number($('[class~=duration' + index + ']').val());
                        currSts.forEach((line) => {
                            cycleTime -= (line.stop - line.start);
                            // if ((lastLine === -1) && (line.num === 0)) lastLine = index - 1;
                        });
                        if (cycleTime !== 0) {
                            if (!lastLine) {
                                currSts[index + 1].stop += cycleTime;
                                if ((currSts[index + 1].stop - currSts[index + 1].start) <= 0) {
                                    currSts[index + 1].stop -= cycleTime;
                                    currSts[index].stop += cycleTime;
                                    $this.val(Number($this.val()) + cycleTime);
                                    return;
                                }
                                $('[class~=duration' + (index + 1) + ']').val(currSts[index + 1].stop - currSts[index + 1].start);
                                $('[class~=start' + (index + 1) + ']').val(currSts[index].stop)
                            } else {
                                currSts[0].stop += cycleTime;
                                if ((currSts[index].stop - currSts[index].start) <= 0) {
                                    currSts[0].stop -= cycleTime;
                                    $this.val(Number($this.val()) + cycleTime);
                                    return;
                                }
                                $('[class~=duration0]').val(currSts[0].stop - currSts[0].start);
                                for (let i = 1; i <= index; i++) {
                                    $('[class~=start' + i + ']').val(currSts[i - 1].stop);
                                    currSts[i].stop = Number($('[class~=start' + i + ']').val()) + Number($('[class~=duration' + i + ']').val());
                                }
                                currSts[index].stop = Number($('#tc').val()) + Number($('#shift').val());
                                // $('[class~=start0]').val(currSts[0].stop)
                            }
                        }
                        pkTableValidate();
                    });
                    break;
                case 5 :
                    $(this).append(
                        '<input class="form-control border-0 plus' + index + '" name="text" type="text"' +
                        'style="max-width: 55px;" value="' + (record.plus ? '+' : '') + '"/>'
                    );
                    break;
            }
        });
    });

    for (let i = 0; i < 12; i++) {
        const allowZero = ['1', '8'];
        $('[class~=duration' + i + ']').on('change', () => {
            let value = Number($('[class~=duration' + i + ']').val());
            let index = i;
            if (value < 10) {
                while (value < 0) {
                    if ((allowZero.indexOf($('[class~=tf' + index + ']').val()) !== -1) || (value !== 0)) {
                        let currValue = Number($('[class~=duration' + index + ']').val());
                        if (((value !== currValue) ? (value + currValue) : value) < 10) {
                            $('[class~=duration' + index + ']').val(10);
                            value += (value !== currValue) ? (currValue - 10) : -10;
                        } else {
                            $('[class~=duration' + index + ']').val(currValue + value);
                            value = 0;
                        }
                    }
                    index++;
                }
            }
        });
    }

    if (tableType) pkTableDurationFunctional();
    pkTableValidate();
    data.state.arrays.SetDK.dk[selected] = setDK[selected];
}

function savePkTable() {
    let currSts = setDK[Number($('#pkSelect').val())].sts;
    currSts.forEach((sw, index) => {

        sw.line = 0;
        sw.start = 0;
        sw.num = 0;
        sw.phase = 0;
        sw.stop = 0;
        sw.plus = false;
        $('[class~=start' + index + ']').val(0);
        $('[class~=tf' + index + ']').val(0);
        if (index !== 0) $('[class~=num' + index + ']').val(0);
        $('[class~=duration' + index + ']').val(0);
        $('[class~=plus' + index + ']').val('');
    });
}

function resetPkTable() {
    let currSts = setDK[Number($('#pkSelect').val())].sts;
    currSts.forEach((sw, index) => {
        sw.line = 0;
        sw.start = 0;
        sw.num = 0;
        sw.phase = 0;
        sw.stop = 0;
        sw.plus = false;
        $('[class~=start' + index + ']').val(0);
        $('[class~=tf' + index + ']').val(0);
        if (index !== 0) $('[class~=num' + index + ']').val(0);
        $('[class~=duration' + index + ']').val(0);
        $('[class~=plus' + index + ']').val('');
    });
}

function pkTableValidate() {
    // let table = $('#pkTable');
    let currSts = setDK[Number($('#pkSelect').val())].sts;

    currSts.forEach((sw, index) => {
        if (($('[class~=num' + index + ']').val() !== '0') || ($('[class~=tf' + index + ']').val() !== '0')) {
            if ((index > 0) && (index < (currSts.length - 1))) {
                sw.start = currSts[index - 1].stop;
                sw.stop = currSts[index - 1].stop + Number($('[class~=duration' + (index) + ']').val());
                $('[class~=start' + (index) + ']').val(currSts[index - 1].stop);
            }
        }
    });
}

//Функция для сохранения изменений в таблице ПК
function pkTableChange(table) {
    $('#' + table).on('change', () => {
        let selected = Number($('#pkSelect').val());
        let currPK = setDK[selected];
        $('#' + table + ' tbody tr').each(function (index) {
            $(this).find('td').each(function (switchIndex) {
                switch (switchIndex) {
                    case 1 :
                        currPK.sts[index].start = Number($(this).find('input').val());
                        break;
                    case 2 :
                        currPK.sts[index].tf = Number($(this).find('select').val());
                        break;
                    case 3 :
                        currPK.sts[index].num = Number($(this).find('input').val());
                        break;
                    // case 4 :
                    //     currPK.sts[index].stop = currPK.sts[index].start + Number($(this).find('input').val());
                    //     break;
                    case 5 :
                        currPK.sts[index].plus = ($(this).find('input').val() === '+');
                        break;
                }
            });
        });
        setDK[selected] = currPK;
//        console.log(setDK[selected].sts);
        data.state.arrays.SetDK.dk[selected] = setDK[selected];
    });
    pkFlag = false;
}

//Функция для преобразования вида цифр
function handsomeNumbers(num) {
    if (num.toString().length >= 2) return num;
    return (num < 10) ? '0' + num : num;
}

//Функция для сохранения изменений всех не табличных элементов
function setChange(element, type, fullPath, numFlag, hardFlag, shitcodeFlag) {
    if (!firstLoad) return;
    let path = fullPath.split('.');
    if (path[1] !== undefined) {
        if (type === 'input') {
            $('#' + element).on('change', () => {
                if (numFlag) {
                    shitcodeFlag ? data.state[path[0]][path[1]][element] = Number($('#' + element).val()) :
                        (hardFlag ? data.state[path[0]][path[1]][path[2]][$('#pkSelect').val()][element] = Number($('#' + element).val())
                            : data.state[path[0]][path[1]][path[2]][element] = Number($('#' + element).val()));
                } else {
                    data.state[path[0]][path[1]][path[2]][$('#pkSelect').val()][element] = $('#' + element).val();
                }
            });
        }
        if (type === 'select') {
            $('#' + element).on('change keyup', () => {
                hardFlag ? data.state[path[0]][path[1]][path[2]][$('#pkSelect').val()][element] = Number($('#' + element + ' option:selected').val())
                    : data.state[path[0]][path[1]][element] = Number($('#' + element + ' option:selected').val());
            });
        }
        if (type === 'checkbox') {
            $('#' + element).on('change', () => {
                hardFlag ? data.state[path[0]][path[1]][path[2]][$('#pkSelect').val()][element] = $('#' + element).prop('checked')
                    : data.state[path[0]][path[1]][element] = $('#' + element).prop('checked');
            });
        }
    } else {
        if (type === 'input') {
            $('#' + element).on('change', () => {
                if (numFlag) {
                    if (fullPath === '') {
                        data.state[element] = Number($('#' + element).val());
                    } else {
                        data.state[path[0]][element] = Number($('#' + element).val());
                    }
                } else {
                    data.state[element] = $('#' + element).val();
                }
            });
        }
        if (type === 'select') {
            if (fullPath === '') {
                $('#' + element).on('change keyup', () => {
                    data.state[element] = Number($('#' + element + ' option:selected').val());
                });
            } else {
                $('#' + element).on('change keyup', () => {
                    data.state[fullPath][element] = Number($('#' + element + ' option:selected').val());
                });
            }
        }
        if (type === 'checkbox') {
            $('#' + element).on('change', () => {
                data.state[element] = $('#' + element).prop('checked');
            });
        }
    }
}

//Отображение кнопки для выбора координат и разблокирование кнопки создания нового перекрёстка
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

//Отображение кнопки для выбора координат и разблокирование кнопки создания нового перекрёстка
function disableControl(button, status) {
    let buttonClass = $('#' + button)[0].className.toString();
    if (status) {
        if (buttonClass.indexOf('disabled') !== -1) buttonClass = buttonClass.substring(0, buttonClass.length - 9);
    } else {
        if (buttonClass.indexOf('disabled') === -1) buttonClass = buttonClass.concat(' disabled');
    }
    $('#' + button)[0].className = buttonClass;
}

//Открытие карты с выбором координат
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

//Отправка выбранной команды на сервер
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
    $('#forceSendButton')[0].className = checkButton($('#forceSendButton')[0].className.toString(), false);
    $('#addButton')[0].className = checkButton($('#addButton')[0].className.toString(), false);
    // $('select').each(function() {
    //     checkSelect($(this), editFlag);
    // });
}