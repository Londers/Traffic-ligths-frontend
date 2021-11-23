'use strict'

let IDs = [];
let ws = undefined;
let map = undefined;
let waiter = undefined;

let boxRemember = {Y: 0, X: 0};
let fixationFlag = false;

let ideviceSave = -1;

let creatingMode = false;

class tfLink {
    constructor() {
        this._west = new cardinalPoint();
        this._north = new cardinalPoint();
        this._east = new cardinalPoint();
        this._south = new cardinalPoint();
        this._add1 = new cardinalPoint();
        this._add2 = new cardinalPoint();
    }

    copy(tfl) {
        this._west = tfl.west;
        this._north = tfl.north;
        this._east = tfl.east;
        this._south = tfl.south;
        this._add1 = tfl.add1;
        this._add2 = tfl.add2;
    }

    get west() {
        return this._west;
    }

    set west(value) {
        this._west = value;
    }

    get north() {
        return this._north;
    }

    set north(value) {
        this._north = value;
    }

    get east() {
        return this._east;
    }

    set east(value) {
        this._east = value;
    }

    get south() {
        return this._south;
    }

    set south(value) {
        this._south = value;
    }

    get add1() {
        return this._add1;
    }

    set add1(value) {
        this._add1 = value;
    }

    get add2() {
        return this._add2;
    }

    set add2(value) {
        this._add2 = value;
    }
}

class cardinalPoint {
    constructor(id, wayPointsArray) {
        this._wayPointsArray = wayPointsArray;
        this._id = id;
    }

    set id(value) {
        this._id = value;
    }

    set wayPointsArray(value) {
        this._wayPointsArray = value;
    }

    get wayPointsArray() {
        return this._wayPointsArray;
    }

    get id() {
        return this._id;
    }

    getPhaseToObj(obj) {
        return this.wayPointsArray?.find(wp => wp.id === obj)?.phase;
    }
}

class wayPoint {
    constructor(id, phase) {
        this._id = id;
        this._phase = phase;
    }

    set id(value) {
        this._id = value;
    }

    set phase(value) {
        this._phase = value;
    }

    get id() {
        return this._id;
    }

    get phase() {
        return this._phase;
    }
}

let currentTfId = '';
let currentTfLink = new tfLink()

const tfLinksArray = [];

$(() => {
    $('body').append('<div class="border border-dark" id="map" ' +
        `style="max-height: 100%; max-width: 100%; position: relative; z-index: 1"></div>`
    )
})

// Извлечение уникальной связки region-area-id
function getUniqueId(trafficLight) {
    return trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID;
}

function getPhase(curr, from, to) {
    return Object.values(tfLinksArray.find(tfl => tfl.id === curr).tflink)
        .find(cp => cp.id === from).getPhaseToObj(to);
}

let svg = {};

ymaps.ready(function () {

    $('#controlModeButton')[0].disabled = true;
    // $('#phaseTableDialog').find('div.fixed-table-body').css('max-height', window.innerHeight * 0.8)

    //Создание и первичная настройка карты
    map = new ymaps.Map('map', {
        center: [54.9912, 73.3685],
        zoom: 19
    });

    $('#dropdownControlButton').trigger('click');

    $('#fixationButton').on('click', function () {
        if (fixationFlag) {
            map.setBounds(boxRemember);
        } else {
            boxRemember = map.getBounds();
            $('#fixationButton')[0].innerText = 'Вернуться';
            fixationFlag = true;
        }
    });

    $('#fixationReset').on('click', function () {
        fixationFlag = false;
        $('#fixationButton')[0].innerText = 'Зафиксировать экран';
    });

    $('#createModeButton').on('click', function () {
        creatingMode = true;
        $('#controlModeButton')[0].disabled = false;
        $('#createModeButton')[0].disabled = true;
    });

    $('#controlModeButton').on('click', function () {
        creatingMode = false;
        $('#controlModeButton')[0].disabled = true;
        $('#createModeButton')[0].disabled = false;
    });

    let closeReason = '';
    ws = new WebSocket('wss://' + location.host + location.pathname + 'W');

    ws.onopen = function () {
        // on connecting, do nothing but log it to the console
        console.log('connected')
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
        alert('Ошибка соединения: ' + closeReason);
    };

    ws.onerror = function (evt) {
        alert(`Ошибка соединения WebSocket, ${evt.reason}`);
    }


    //Функция для обновления статусов контроллеров в реальном времени
    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        // console.log(data);
        // localStorage.setItem("maintab", "closed");
        switch (allData.type) {
            case 'mapInfo':
                //Заполнение поля выбора регионов для перемещения
                for (let reg in data.regionInfo) {
                    $('#region').append(new Option(data.regionInfo[reg], reg));
                }
                fillAreas($('#area'), $('#region'), data.areaInfo);

                $('#regionForm').on('change', function () {
                    fillAreas($('#area'), $('#region'), data.areaInfo);
                });

                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);

                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        // balloonContentHeader: 'Выберите фазу',
                        // balloonContentBody: 'Содержимое <em>балуна</em> метки',
                        // balloonContentFooter: 'Подвал',
                        hintContent: trafficLight.description
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }, trafficLight.tlsost.num),
                    });
                    placemark.pos = {region: trafficLight.region.num, area: trafficLight.area.num, id: trafficLight.ID};
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function () {
                        handlePlacemarkClick(map, trafficLight, placemark);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });
                // .append(new Option(regionInfo[reg], reg));
                break;
            case 'tflight':
                if (data.tflight === null) {
                    console.log('null');
                } else {
                    // console.log('Обновление');
                    //Обновление статуса контроллера происходит только при его изменении
                    data.tflight.forEach(trafficLight => {
                        let id = trafficLight.ID;
                        let index = IDs.indexOf(trafficLight.region.num + '-' + trafficLight.area.num + '-' + id);
                        //Создание меток контроллеров на карте
                        let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                            balloonContent: 'Отсутсвует картинка перекрёстка',
                            hintContent: trafficLight.description + '<br>' + trafficLight.idevice
                        }, {
                            iconLayout: createChipsLayout(function (zoom) {
                                // Размер метки будет определяться функией с оператором switch.
                                return calculate(zoom);
                            }, trafficLight.tlsost.num)
                        });
                        placemark.events.add('click', function () {
                            handlePlacemarkClick(map, trafficLight, placemark);
                        });

                        // Если открыто управление перекрёстком, замена объекта на карте произойдет по закрытию управления
                        if (ideviceSave !== trafficLight.idevice) {
                            //Замена метки контроллера со старым состоянием на метку с новым
                            map.geoObjects.splice(index, 1, placemark);
                        } else {
                            clearInterval(waiter);
                            waiter = setInterval(() => {
                                if (ideviceSave === -1) {
                                    map.geoObjects.splice(index, 1, placemark);
                                    clearInterval(waiter);
                                }
                            }, 100);
                        }
                    })
                }
                break;
            //  case 'repaint':
            //     map.geoObjects.removeAll();
            //     //Разбор полученной от сервера информации
            //     data.tflight.forEach(trafficLight => {
            //         IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
            //         //Создание меток контроллеров на карте
            //         let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
            //             balloonContent: 'balloon',
            //             hintContent: trafficLight.description + '<br>' + trafficLight.idevice
            //         }, {
            //             iconLayout: createChipsLayout(function (zoom) {
            //                 // Размер метки будет определяться функией с оператором switch.
            //                 return calculate(zoom);
            //             }, trafficLight.tlsost.num),
            //         });
            //         //Функция для вызова АРМ нажатием на контроллер
            //         placemark.events.add('click', function () {
            //             handlePlacemarkClick(map, trafficLight);
            //         });
            //         //Добавление метки контроллера на карту
            //         map.geoObjects.add(placemark);
            //     });
            //     areaZone = data.areaZone;
            //     createAreasLayout(map);
            //     break;
            case 'phases':
                if (data.phases[0].phase === 9) return;
                $('#table tbody tr[style="background-color: lightgreen;"]').css({backgroundColor: 'white'})
                $(`#table tbody td:hidden:contains("${data.phases[0].phase}")`).parent().css({backgroundColor: 'lightgreen'})
                // console.log('phases', data)
                break;
            case 'jump':
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);
                break;
            case 'error':
                closeReason = data.message;
                ws.close(1000);
                break;
            case 'close':
                closeReason = 'WS Closed by server';
                ws.close(1000);
                window.close();
                break;
            default:
                break;
        }
    };

    //Выбор места для открытия на карте
    $('#locationButton').on('click', function () {
        $('#locationDialog').dialog('open');
    });

    //Всплывающее окно для создания пользователя /locationButton
    $('#locationDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                //Проверка корректности введённых данных
                if (($('#area option:selected').text() === '')) {
                    if (!($('#areasMsg').length) && ($('#area option:selected').text() === '')) {
                        $('#areasForm').append('<div style="color: red;" id="areasMsg"><h5>Выберите районы</h5></div>');
                    }
                    return;
                }
                let selectedAreas = $('#area option:selected').toArray().map(item => item.value);

                //Сбор данных для отправки на сервер
                let toSend = {
                    type: 'jump',
                    region: $('#region option:selected').val(),
                    area: selectedAreas
                };
                //Отправка данных на сервер
                ws.send(JSON.stringify(toSend));

                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false,
        close: function () {
            $('#areasMsg').remove();
        }
    });

    $('#tableDialog').dialog({
        autoOpen: false,
        buttons: {
            'Ок': function () {
                updateBindings();
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        minWidth: window.innerWidth * 0.9,
        // height: window.innerHeight * 0.9,
        modal: true,
        resizable: false
    });

    function validateTfLink() {
        const allValidFrom = Array.from($('td.from input')).map(input => input.value);
        Object.values(currentTfLink).forEach(cp => {
            const deleteIndexes = []
            cp.wayPointsArray?.forEach((wp, i) => {
                if ((!allValidFrom.some(from => from === wp.id)) || (cp.id === wp.id)) {
                    deleteIndexes.push(i)
                }
            })
            deleteIndexes.sort((a, b) => b - a).forEach(del => cp.wayPointsArray.splice(del, 1))
        })
    }

    function updateBindings() {
        validateTfLink();
        let emptyLink = new tfLink();
        emptyLink.copy(currentTfLink);
        if (tfLinksArray.some(tfl => tfl.id === currentTfId)) {
            // tfLinksArray.find(tfl => tfl.id === currentTfId).tflink = JSON.parse(JSON.stringify(currentTfLink))
            tfLinksArray.find(tfl => tfl.id === currentTfId).tflink = emptyLink
        } else {
            // tfLinksArray.push({id: currentTfId, tflink: JSON.parse(JSON.stringify(currentTfLink))});
            tfLinksArray.push({id: currentTfId, tflink: emptyLink});
        }
        ws.send(JSON.stringify({type: 'updateBindings', data: tfLinksArray}));
        currentTfLink = new tfLink();
        currentTfId = '';
    }

    function getPhasesSvg(trafficLight) {
        return new Promise(function (resolve) {
            $.ajax({
                url: window.location.origin + '/file/static/cross/' + trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID + '/cross.svg',
                type: 'GET',
                success: function (svgData) {
                    // todo Жду обновлённые картинки от Андрея
                    // let x2js = new X2JS();
                    // let data = x2js.xml2json(svgData);
                    // svg.push(data.svg.mphase.phase)

                    // $('body').append('<div id="kostil" class="img-fluid" style="display: none" />');
                    $('#svgContainer').html(svgData.children[0].outerHTML.replace('let currentPhase', 'var currentPhase'));
                    const uniqueId = trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID;
                    if (typeof getPhasesMass === "function") {
                        svg[uniqueId] = getPhasesMass()
                        resolve(true);
                    } else {
                        svg[uniqueId] = [];
                        resolve(false);
                    }

                    // if (svg[uniqueId] ?? true) handleSelectChange(trafficLight);
                    // $('#kostil').remove();
                },
                error: function (request) {
                    console.log(request.status + ' ' + request.responseText);
                    alert(JSON.parse(request.responseText).message);
                    resolve(false);
                }
            });
        })
    }

    function makeSelects(trafficLight) {
        $('td.phase').each((i, td) => {
            const phases = {currPhase: -1, phases: trafficLight.phases};
            let optionsHTML = '';
            $(td).empty();
            phases.phases.forEach(phase => {
                optionsHTML +=
                    `<option value="${phase}">${phase}</option>`;
                // `<option value="${phase}" ${((phase === phases.currPhase) ? ' selected="selected"' : '')}>${phase}</option>`;
            });

            $($('td.to')[i]).find('div').each((j, val) => {
                $(td).append(`<select id="phase${i + '-' + j}">${optionsHTML}</select>`)

                let phase = 1;
                if (tfLinksArray.some(tfl => tfl.id === getUniqueId(trafficLight))) {
                    const tfl = tfLinksArray.find(tflink => tflink.id === getUniqueId(trafficLight)).tflink;
                    phase = getPhase(getUniqueId(trafficLight), tfl[directions[i].en].id, $($('td.to')[i]).find('div')[j].innerText) ?? 1
                    // phase = tfl[directions[i].en].getPhaseToObj($($('td.to')[i]).find('div')[j].innerText) ?? 1
                }

                const wayPointsArr = currentTfLink[directions[i].en].wayPointsArray
                if (wayPointsArr.some(wp => wp.id === val.innerText)) {
                    let currIndex = wayPointsArr.findIndex(wp => wp.id === val.innerText)
                    wayPointsArr[currIndex] = new wayPoint(val.innerText, phase.toString())
                } else {
                    wayPointsArr.push(new wayPoint(val.innerText, phase.toString()))
                }
                $(`#phase${i + '-' + j}`).val(phase).on('change', () => handleSelectChange(i + '-' + j));
            })
        })
    }

    function handleSelectChange(index) {
        const value = $('#phase' + index).val();
        const split = index.split('-');
        const currDir = directions[split[0]].en;
        const to = $($('td.to')[split[0]]).find('div')[split[1]].innerText;
        currentTfLink[currDir].wayPointsArray.find(wp => wp.id === to).phase = value;
    }

    function fillPhases(trafficLight) {
        $('#phaseContainer').empty()
        let currSvg = svg[trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID];
        let width = $('#phaseContainer').width() / 3;

        for (let i = 0; i <= Math.floor((currSvg.length - 1) / 4); i++) {
            $('#phaseContainer').append(`<div id="miniContainer${i}" 
                style="width: ${100 / (Math.floor((currSvg.length - 1) / 4))}%"></div>`)
        }

        currSvg.forEach((phaseSvg, i) => {
            let containerIndex = Math.floor(i / 4)
            $('#miniContainer' + containerIndex).append(
                `<div class="text-center m-1" style="display: inline-flex;">` +
                `<h2 class="my-auto">${phaseSvg.num}</h2>` +
                `<svg width="100%" height="100%"` +
                `style="background-color: white; ` +
                `max-height: ${width}px; max-width: ${width}px;" xmlns="http://www.w3.org/2000/svg"` +
                `xmlns:xlink="http://www.w3.org/1999/xlink">` +
                `<image x="0" y="0" width="100%" height="100%"` +
                `style="max-height: ${width}px; max-width: ${width}px;"` +
                `xlink:href="data:image/png;base64,${phaseSvg.phase}"></image>` +
                `</svg>` +
                `</div>`
            )
        })

        $('#table').trigger('resize');
        $($('.ui-dialog')[1]).css({top: ((window.innerHeight - $('.ui-dialog')[1].offsetHeight) / 2)})
    }

    function handlePlacemarkClick(map, trafficLight) {
        console.log(map, trafficLight);

        if (creatingMode) {
            $('#tableDialog').dialog('open');
            getPhasesSvg(trafficLight).then(
                (success) => {
                    if (success) fillPhases(trafficLight)
                }
            )
            fillTable(trafficLight);
            currentTfId = getUniqueId(trafficLight);
            $('.ui-dialog-title')[1].innerText = trafficLight.description
        } else {
            console.log('click;')
        }
        // Команда на влкючение передачи фаз
        // controlSend(trafficLight.idevice, 4, 1)
        // ideviceSave = trafficLight.idevice;
        // $.ajax({
        //     url: window.location.origin + '/file/static/cross/' + trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID + '/cross.svg',
        //     type: 'GET',
        //     success: function () {
        //         let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
        //             // balloonContentHeader: 'Выберите фазу',
        //             balloonContentBody: 'BALLOON CONTENT',
        //             // balloonContentFooter: 'Подвал',svgData.children[0].outerHTML
        //             hintContent: trafficLight.description
        //         }, {
        //             iconLayout: createChipsLayout(function (zoom) {
        //                 // Размер метки будет определяться функией с оператором switch.
        //                 return calculate(zoom);
        //             }, trafficLight.tlsost.num),
        //         });
        //         placemark.pos = {region: trafficLight.region.num, area: trafficLight.area.num, id: trafficLight.ID};
        //         //Функция для вызова АРМ нажатием на контроллер
        //         placemark.events.add('click', function () {
        //             handlePlacemarkClick(map, trafficLight, placemark);
        //         });
        //         placemark.events.add('balloonclose', function () {
        //             // Выключение передачи фаз предыдущего перекрёстка
        //             ideviceSave = -1;
        //         });
        //         placemark.events.add('balloonopen', function () {
        //             // Выключение передачи фаз предыдущего перекрёстка
        //             controlSend(trafficLight.idevice, 4, 1);
        //             ideviceSave = trafficLight.idevice;
        //         });
        //         //Добавление метки контроллера на карту
        //         // map.geoObjects.add(placemark);
        //
        //         try {
        //             map.geoObjects.splice(map.geoObjects.indexOf(oldplacemark), 1, placemark);
        //             placemark.balloon.open();
        //         } catch (e) {
        //             console.log('error', e.message);
        //             // handlePlacemarkClick(map, trafficLight, oldplacemark);
        //             return;
        //         }
        //
        //         // placemark.balloon.open().then(() => $('#table').parent().parent().width('').height(''));
        //     },
        //     error: function (request) {
        //         console.log(request.status + ' ' + request.responseText);
        //         alert(JSON.parse(request.responseText).message);
        //     }
        // });
    }

    const directions = [{en: 'west', ru: 'З'}, {en: 'north', ru: 'С'}, {en: 'east', ru: 'В'}, {en: 'south', ru: 'Ю'}];
    const directionsStr = 'ЮВСЗ';

    function makeToInputs(trafficLight) {
        $('td.from').each((i, td) => {
            if ($(td).find("input").val() === '') {
                $('td.to')[i].innerHTML = '';
                return;
            }
            const otherDirs = directions.filter(dir => dir.ru !== directions[i].ru);
            let otherValues = [];
            otherDirs.forEach(dir => {
                if ((currentTfLink[dir.en].id !== '') && (currentTfLink[dir.en].id ?? false)) {
                    otherValues.push({dir: dir.ru, id: currentTfLink[dir.en].id});
                }
            })

            const part1 = directionsStr.slice(0, directionsStr.indexOf(directions[i].ru))
            const part2 = directionsStr.slice(directionsStr.indexOf(directions[i].ru) + 1, directionsStr.length)
            const part = Array.from(part2 + part1);

            otherValues = otherValues.sort((val1, val2) => {
                return part.indexOf(val1.dir) - part.indexOf(val2.dir)
            })

            if (currentTfLink[directions[i].en].wayPointsArray === undefined) currentTfLink[directions[i].en].wayPointsArray = [];
            let toHTML = '';
            otherValues.forEach(val => {
                toHTML += `<div>${val.id}</div>`;
            })
            $('td.to')[i].innerHTML = toHTML;
        })
        makeSelects(trafficLight)
        $('#table').trigger('resize');
    }

    function handleFromInputKeyup(trafficLight, index, evt) {
        currentTfLink[directions[index].en].id = evt.currentTarget.value;
        $('#' + directions[index].en).text(evt.currentTarget.value);
        makeToInputs(trafficLight);
    }

    function fillTable(trafficLight) {
        const initialState = [];
        directions.forEach(dir => {
            initialState.push({
                direction: dir.ru,
            });
            $('#' + dir.en).text(dir.ru);
        })

        $('#table').bootstrapTable('load', initialState);
        $('.fixed-table-container').prop('style', '');
        $('.fixed-table-toolbar').remove()
        $('td.from').each((i, td) => {
            $(td).html(`<input type="text" class="form-control mx-auto" id="from${i}" required="" ` +
                'style="max-width: 100px;">');
            $(td).find('input').on('keyup', (evt) => handleFromInputKeyup(trafficLight, i, evt))
        })

        if (tfLinksArray.some(tfl => tfl.id === getUniqueId(trafficLight))) {
            const tfl = tfLinksArray.find(tflink => tflink.id === getUniqueId(trafficLight)).tflink;
            currentTfLink = tfl;
            directions.forEach((dir, index) => {
                $('td.from input')[index].value = (tfl[dir.en]?.id) ?? ''
            })
            makeToInputs(trafficLight);
            // $('td.from input').trigger('keyup');
        }
    }

    //Заполнение поля выбора районов для создания или изменения пользователя
    function fillAreas($area, $region, areaInfo) {
        $area.empty();
        for (let regAreaJson in areaInfo) {
            for (let areaJson in areaInfo[regAreaJson]) {
                if (regAreaJson === $region.find(':selected').text()) {
                    $area.append(new Option(areaInfo[regAreaJson][areaJson], areaJson));
                }
            }
        }
    }
})

//Отправка выбранной команды на сервер
function controlSend(idevice, cmd, num) {
    ws.send(JSON.stringify({type: 'dispatch', id: idevice, cmd: cmd, param: num}));
}

let createChipsLayout = function (calculateSize, currnum) {
    if (currnum === 0) {
        console.log('Возвращен несуществующий статус');
        return null;
    }
    // Создадим макет метки.
    let Chips = ymaps.templateLayoutFactory.createClass(
        '<div class="placemark"  style="background-image:url(\'' + location.origin + '/free/img/trafficLights/' + currnum + '.svg\'); background-size: 100%"></div>', {
            build: function () {
                Chips.superclass.build.call(this);
                let map = this.getData().geoObject.getMap();
                if (!this.inited) {
                    this.inited = true;
                    // Получим текущий уровень зума.
                    let zoom = map.getZoom();
                    // Подпишемся на событие изменения области просмотра карты.
                    map.events.add('boundschange', function () {
                        // Запустим перестраивание макета при изменении уровня зума.
                        let currentZoom = map.getZoom();
                        if (currentZoom !== zoom) {
                            zoom = currentZoom;
                            this.rebuild();
                        }
                    }, this);
                }
                let options = this.getData().options,
                    // Получим размер метки в зависимости от уровня зума.
                    size = calculateSize(map.getZoom()),
                    element = this.getParentElement().getElementsByClassName('placemark')[0],
                    // По умолчанию при задании своего HTML макета фигура активной области не задается,
                    // и её нужно задать самостоятельно.
                    // Создадим фигуру активной области "Круг".
                    circleShape = {
                        type: 'Circle',
                        coordinates: [0, 0],
                        radius: size / 2
                    };
                // Зададим высоту и ширину метки.
                element.style.width = element.style.height = size + 'px';
                // Зададим смещение.
                element.style.marginLeft = element.style.marginTop = -size / 2 + 'px';
                // Зададим фигуру активной области.
                options.set('shape', circleShape);
            }
        }
    );
    return Chips;
};

//Мастшабирование иконов светофороф на карте
let calculate = function (zoom) {
    switch (zoom) {
//		          case 11:
//		            return 5;
//		          case 12:
//		            return 10;
//		          case 13:
//		            return 20;
        case 14:
            return 30;
        case 15:
            return 35;
        case 16:
            return 50;
        case 17:
            return 60;
        case 18:
            return 80;
        case 19:
            return 130;
        default:
            return 25;
        // return 80;
    }
};