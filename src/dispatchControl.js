'use strict'

let IDs = [];
// let regionInfo;
// let areaInfo;
let areaZone = undefined;
let areaLayout = [];
let subareasLayout = [];
let ws = undefined;
let map = undefined;

ymaps.ready(function () {

    //Создание и первичная настройка карты
    map = new ymaps.Map('map', {
        center: [54.9912, 73.3685],
        zoom: 19
    });

    ws = new WebSocket('wss://' + location.host + location.pathname + 'W');

    ws.onerror = function (evt) {
        console.log('WebSocket error:', evt);
    };

    ws.onopen = function () {
        // on connecting, do nothing but log it to the console
        console.log('connected')
    };

    //Функция для обновления статусов контроллеров в реальном времени
    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        console.log(data);
        // localStorage.setItem("maintab", "closed");
        switch (allData.type) {
            case 'mapInfo':
                // regionInfo = data.regionInfo;
                // areaInfo = data.areaInfo;
                if ((areaZone === undefined) && (data.areaZone !== undefined)) {
                    areaZone = data.areaZone;
                    createAreasLayout(map);
                }

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
                        balloonContentBody: 'Содержимое <em>балуна</em> метки',
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
                    console.log('Обновление');
                    if (data.areaZone !== undefined) {
                        areaZone = data.areaZone;
                        deleteSubareasLayout(map);
                        createSubareasLayout(map);
                    }
                    //Обновление статуса контроллера происходит только при его изменении
                    data.tflight.forEach(trafficLight => {
                        let id = trafficLight.ID;
                        let index = IDs.indexOf(trafficLight.region.num + '-' + trafficLight.area.num + '-' + id);
                        //Создание меток контроллеров на карте
                        let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                            balloonContent: 'balloon',
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
                        //Замена метки контроллера со старым состоянием на метку с новым
                        map.geoObjects.splice(index, 1, placemark);
                        if (trafficLight.idevice === ideviceSave) handlePlacemarkClick(map, trafficLight, placemark);
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
            case 'close':
                // if (editFlag) controlSend({id: idevice, cmd: 4, param: 0});
                ws.close();
                // if (data.message !== '') {
                //     if (!document.hidden) alert(data.message);
                // } else {
                //     if (!document.hidden) alert('Потеряна связь с сервером');
                // }
                window.close();
                break;
            case 'error':
                console.log('Error', allData);
                break;
            default:
                break;
        }
    };

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

    function createAreasLayout(map) {
        if (!$('#switchLayout').prop('checked')) return;
        areaZone.forEach(area => {
            let polygon = convexHullTry(map, area.zone, 'Регион: ' + area.region + ', Район: ' + area.area);
            areaLayout.push(polygon);
        })
    }

    // function deleteAreasLayout(map) {
    //     areaLayout.forEach(layout => {
    //         map.geoObjects.remove(layout);
    //     });
    //     areaLayout = [];
    // }

    function createSubareasLayout(map) {
        if (!$('#switchSubLayout').prop('checked')) return;
        areaZone.forEach(area => {
            area.sub.forEach(sub => {
                let polygon = convexHullTry(map, sub.zone, 'Регион: ' + area.region + ', Район: ' + area.area + ', Подрайон:' + sub.subArea);
                subareasLayout.push(polygon);
            })
        })
    }

    function deleteSubareasLayout(map) {
        subareasLayout.forEach(layout => {
            map.geoObjects.remove(layout);
        });
        subareasLayout = [];
    }

    function getRandomColor() {
        let letters = '0123456789A';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 11)];
        }
        return color;
    }

    function convexHullTry(map, coordinates, description) {
        let color = getRandomColor();
        // Создаем многоугольник, используя вспомогательный класс Polygon.
        let myPolygon = new ymaps.Polygon([
            // Указываем координаты вершин многоугольника.
            // Координаты вершин внешнего контура.
            coordinates.map(point => [point.Y, point.X]),
            // Координаты вершин внутреннего контура.
            [
                [0, 0]
            ]
        ], {
            // Описываем свойства геообъекта.
            // Содержимое балуна.
            hintContent: description
        }, {
            // Задаем опции геообъекта.
            // Цвет заливки.
            fillColor: color,
            fillOpacity: 0.1,
            // Ширина обводки.
            strokeWidth: 5
        });

        // Добавляем многоугольник на карту.
        map.geoObjects.add(myPolygon);
        return myPolygon;
    }

    let ideviceSave = -1;
    function handlePlacemarkClick(map, trafficLight, oldplacemark) {
        console.log(map, trafficLight);

        // Команда на влкючение передачи фаз
        // controlSend(trafficLight.idevice, 4, 1)
        ideviceSave = trafficLight.idevice;
        $.ajax({
            url: window.location.origin + '/file/static/cross/' + trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID + '/cross.svg',
            type: 'GET',
            success: function (svgData) {
                let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                    // balloonContentHeader: 'Выберите фазу',
                    balloonContentBody:
                        buildPhaseTable(svgData.children[0].outerHTML
                            .replace('let currentPhase', 'var currentPhase'), trafficLight.idevice),
                    // balloonContentFooter: 'Подвал',svgData.children[0].outerHTML
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
                placemark.events.add('balloonclose', function () {
                    // Выключение передачи фаз предыдущего перекрёстка
                    controlSend(trafficLight.idevice, 4, 0);
                    clearInterval(phaseSender);
                });
                placemark.events.add('balloonopen', function () {
                    // Выключение передачи фаз предыдущего перекрёстка
                    controlSend(trafficLight.idevice, 4, 1);
                });
                //Добавление метки контроллера на карту
                // map.geoObjects.add(placemark);
                try {
                    map.geoObjects.splice(map.geoObjects.indexOf(oldplacemark), 1, placemark);
                } catch (e) {
                    console.log('error', e.message);
                    // handlePlacemarkClick(map, trafficLight, oldplacemark);
                    return;
                }
                placemark.balloon.open();
            },
            error: function (request) {
                console.log(request.status + ' ' + request.responseText);
            }
        });
    }

    function buildPhaseTable(svg, idevice) {
        $('#del').remove();
        $('body').append(`<div id="del" style="display: none">${svg}</div>`);
        let table =
            '<table id="table" class="table table-bordered" style="text-align: center;">' +
            '   <thead>' +
            '       <tr>' +
            '           <th data-field="num" style="display: none">Номер</th>' +
            '           <th data-field="desc">Фаза</th>' +
            '       </tr>' +
            '   </thead>' +
            '   <tbody>' +
            '   </tbody>' +
            '</table>';
        if (getPhasesMass === undefined) {
            table = 'Отсутсвуют картинки фаз';
        } else {
            const phasesMass = getPhasesMass();
            let phases = '';
            const specialCommands = [{num: 10, phase: '/jm.svg'}, {num: 11, phase: '/os.svg'},
                {num: 0, phase: '/lr.svg'}, {num: 9, phase: '/ky.svg'}]

            phasesMass.forEach((pic, i) => {
                phases +=
                    `<tr data-index="${i}" class="" onclick="colorControl(${idevice}, 9, ${pic.num})">` +
                    `    <td style="display: none">${pic.num}</td>` +
                    `    <td style="">` +
                    `        <svg width="100%" height="100%"` +
                    `            style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;" xmlns="http://www.w3.org/2000/svg"` +
                    `            xmlns:xlink="http://www.w3.org/1999/xlink">` +
                    `             <image x="0" y="0" width="100%" height="100%"` +
                    `               style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;"` +
                    `               xlink:href="data:image/png;base64,${pic.phase}"></image>` +
                    `        </svg>` +
                    `    </td>` +
                    `</tr>`
            });

            const index = table.indexOf('<tbody>');
            table = table.slice(0, index) + phases + table.slice(index, table.length);

            specialCommands.forEach((pic) => {
                table +=
                    `<div class="btn btn-light border" onclick="controlSend(${idevice}, 9, ${pic.num})">` +
                    ` <img className="img-fluid" src="/file/static/img/buttons${pic.phase}"` +
                    ` height="50" alt="error">` +
                    `</div>`
            })
        }
        return table;
    }
})

let phaseSender;

function colorControl(idevice, cmd, num) {
    clearInterval(phaseSender);
    $('#table tbody tr[style="background-color: lightblue;"]').css({backgroundColor: 'white'})
    $(`#table tbody td:hidden:contains("${num}")`).parent().css({backgroundColor: 'lightblue'})
    controlSend(idevice, cmd, num)
    phaseSender = setInterval(() => controlSend(idevice, cmd, num), 1000)
}

//Отправка выбранной команды на сервер
function controlSend(idevice, cmd, num) {
    ws.send(JSON.stringify({type: 'dispatch', id: idevice, cmd: cmd, param: num}));
}