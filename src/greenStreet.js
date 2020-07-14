'use strict';

let currnum = -1;
let IDs = [];
let areaLayout = [];
let subareasLayout = [];
let regionInfo;
let areaInfo;
let areaBox;
let boxRemember = {Y: 0, X: 0};
let description = '';
let modeList = [];
let modeListLength = 0;
let circlesList = [];
let zoom = 19;
// let login = '';
let fixationFlag = false;
let ws;

//Функция для открытия вкладки
function openPage(url) {
    window.open(location.origin + '/user/' + localStorage.getItem('login') + url);
}

function getRandomColor() {
    var letters = '0123456789A';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 11)];
    }
    return color;
}

function handleClick(map, coordinates, region, area, id, description) {
    modeList.push({
        num: modeListLength++,
        phase: -1,
        point: {Y: coordinates[0], X: coordinates[1]},
        pos: {region: region, area: area, id: id}
    });

    // Создаем круг.
    var myCircle = new ymaps.Circle([
        // Координаты центра круга.
        coordinates,
        // Радиус круга в метрах.
        1000
    ], {
        // Описываем свойства круга.
        // Содержимое балуна.
        balloonContent: "Радиус круга - 10 км",
        // Содержимое хинта.
        hintContent: "Подвинь меня"
    }, {
        // Задаем опции круга.
        // Включаем возможность перетаскивания круга.
        draggable: false,
        // Цвет заливки.
        // Последний байт (77) определяет прозрачность.
        // Прозрачность заливки также можно задать используя опцию "fillOpacity".
        fillColor: "#DB709377",
        // Цвет обводки.
        strokeColor: "#990066",
        // Прозрачность обводки.
        strokeOpacity: 0.8,
        // Ширина обводки в пикселях.
        strokeWidth: 5
    });

    circlesList.push(myCircle);

    // Добавляем круг на карту.
    map.geoObjects.add(myCircle);


    let tflight = [];
    //Заполнение структуры для дальнейшей записи в таблицу
    tflight.push({
        desc: description,
        phase: -1,
    });
    $('#table').bootstrapTable('append', tflight);
    $('#table').bootstrapTable('scrollTo', 'top');
}

function radiusCalculate(zoom) {
    return zoom * 1000;
    // switch (zoom) {
    //     case 3:
    //         return 128000000;
    //     case 4:
    //         return 64000000;
    //     case 5:
    //         return 32000000;
    //     case 6:
    //         return 16000000;
    //     case 7:
    //         return 8000000;
    //     case 8:
    //         return 4000000;
    //     case 9:
    //         return 2000000;
    //     case 10:
    //         return 1000000;
    //     case 11:
    //         return 500000;
    //     case 12:
    //         return 250000;
    //     case 13:
    //         return 125000;
    //     case 14:
    //         return 62500;
    //     case 15:
    //         return 31250;
    //     case 16:
    //         return 15625;
    //     case 17:
    //         return 78312;
    //     case 18:
    //         return 39156;
    //     case 19:
    //         return 19578;
    //     default:
    //         return 250000;
    // }
}

function circlesControl(map) {
    if (zoom !== map._zoom) {
        circlesList.forEach(circle => {
            map.geoObjects.remove(circle);
        });
        circlesList.forEach(circle => {
            // console.log(circle.geometry.radius + ' --- ' + map._zoom);
            circle.geometry.setRadius(radiusCalculate(map._zoom));
            // console.log(circle.geometry.radius + ' --- ' + map._zoom);
            map.geoObjects.add(circle);
        });
        zoom = map._zoom;
    }
}

ymaps.ready(function () {
    $('#dropdownLayersButton').trigger('click');
    $('#dropdownControlButton').trigger('click');

    //Выбор места для открытия на карте
    $('#locationButton').on('click', function () {
        $('#locationDialog').dialog('open');
    });

    //Создание и первичная настройка карты
    let map = new ymaps.Map('map', {
        center: [54.9912, 73.3685],
        zoom: 19,
    });

    map.events.add('wheel', function () {
        circlesControl(map);
    });

    map.events.add('mousemove', function () {
        circlesControl(map);
    });

    map.events.add('click', function () {
        circlesControl(map);
    });

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

    $('#switchSubLayout').on('change', function () {
        if ($('#switchSubLayout').prop('checked')) {
            if (subareasLayout.length === 0) createSubareasLayout(map);
        } else {
            if (subareasLayout.length !== 0) deleteSubareasLayout(map);
        }
    });

    $('#switchLayout').on('change', function () {
        if ($('#switchLayout').prop('checked')) {
            if (areaLayout.length === 0) createAreasLayout(map);
        } else {
            if (areaLayout.length !== 0) deleteAreasLayout(map);
        }
    });

    $('#sendModeButton').on('click', function () {
        ws.send(JSON.stringify({type: 'createMode', description: description, listTL: modeList}));
    });
    ws = new WebSocket('ws://' + location.host + location.pathname + 'W');

    ws.onerror = function (evt) {
        console.log('WebsSocket error:', evt);
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
                regionInfo = data.regionInfo;
                areaInfo = data.areaInfo;
                // let techRegionInfo = (data.region === '*') ? regionInfo : data.region;
                // let techAreaInfo = (data.area === null) ? areaInfo : data.area;
                if ((areaBox === undefined) && (data.areaBox !== undefined)) {
                    areaBox = data.areaBox;
                    createAreasLayout(map);
                }

                //Заполнение поля выбора регионов для перемещения
                for (let reg in regionInfo) {
                    $('#region').append(new Option(regionInfo[reg], reg));
                }
                fillAreas($('#area'), $('#region'), areaInfo);

                // map.controls.remove('searchControl');

                $('#regionForm').on('change', function () {
                    fillAreas($('#area'), $('#region'), areaInfo);
                });

                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);

                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    currnum = trafficLight.tlsost.num;
                    IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        hintContent: trafficLight.description
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }),
                    });
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function () {
                        handleClick(map, [trafficLight.points.Y, trafficLight.points.X], trafficLight.region.num, trafficLight.area.num, trafficLight.ID, trafficLight.description);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });
                break;
            case 'tflight':
                if (data.tflight === null) {
                    console.log('null');
                } else {
                    console.log('Обновление');
                    //Обновление статуса контроллера происходит только при его изменении
                    data.tflight.forEach(trafficLight => {
                        currnum = trafficLight.tlsost.num;
                        let id = trafficLight.ID;
                        let index = IDs.indexOf(trafficLight.region.num + '-' + trafficLight.area.num + '-' + id);
                        let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                            hintContent: trafficLight.description
                        }, {
                            iconLayout: createChipsLayout(function (zoom) {
                                // Размер метки будет определяться функией с оператором switch.
                                return calculate(zoom);
                            })
                        });
                        placemark.events.add('click', function () {
                            handleClick(map, [trafficLight.points.Y, trafficLight.points.X], trafficLight.region.num, trafficLight.area.num, trafficLight.ID, trafficLight.description);
                        });
                        //Замена метки контроллера со старым состоянием на метку с новым
                        map.geoObjects.splice(index, 1, placemark);
                    })
                }
                break;
            case 'repaint':
                map.geoObjects.removeAll();
                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    currnum = trafficLight.tlsost.num;
                    IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        hintContent: trafficLight.description
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }),
                    });
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function () {
                        handleClick(map, [trafficLight.points.Y, trafficLight.points.X], trafficLight.region.num, trafficLight.area.num, trafficLight.ID, trafficLight.description);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });
                areaBox = data.areaBox;
                createAreasLayout(map);
                break;
            case 'jump':
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);
                break;
            case 'createMode':
                if (data.error) {
                    alert(data.error);
                    return;
                }
                let color = getRandomColor();
                let myRectangle = new ymaps.Rectangle([
                    // Задаем координаты диагональных углов прямоугольника.
                    [data.mode.box.point0.Y, data.mode.box.point0.X],
                    [data.mode.box.point1.Y, data.mode.box.point1.X]
                ], {
                    //Свойства
                    hintContent: data.mode.description,
                    balloonContent: 'azaza'
                }, {
                    // Опции.
                    // Цвет и прозрачность заливки.
                    fillColor: color,
                    // Дополнительная прозрачность заливки..
                    // Итоговая прозрачность будет не #33(0.2), а 0.1(0.2*0.5).
                    fillOpacity: 0.1,
                    // Цвет обводки.
                    strokeColor: color,
                    // Прозрачность обводки.
                    strokeOpacity: 0.5,
                    // Ширина линии.
                    strokeWidth: 2,
                    // Радиус скругления углов.
                    // Данная опция принимается только прямоугольником.
                    borderRadius: 6
                });
                subareasLayout.push(myRectangle);
                map.geoObjects.add(myRectangle);
                break;
            case 'error':
                break;
        }
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
        // alert('Связь была разорвана');
        window.close();
        // automatically try to reconnect on connection loss
    };

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

});

let createChipsLayout = function (calculateSize) {
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
    areaBox.forEach(area => {
        let color = getRandomColor();
        let myRectangle = new ymaps.Rectangle([
            // Задаем координаты диагональных углов прямоугольника.
            [area.box.point0.Y, area.box.point0.X],
            [area.box.point1.Y, area.box.point1.X]
        ], {
            //Свойства
            hintContent: 'Регион: ' + area.region + ', Область: ' + area.area,
            balloonContent: 'азаза'
        }, {
            // Опции.
            // Цвет и прозрачность заливки.
            fillColor: color,
            // Дополнительная прозрачность заливки..
            // Итоговая прозрачность будет не #33(0.2), а 0.1(0.2*0.5).
            fillOpacity: 0.1,
            // Цвет обводки.
            strokeColor: color,
            // Прозрачность обводки.
            strokeOpacity: 0.5,
            // Ширина линии.
            strokeWidth: 2,
            // Радиус скругления углов.
            // Данная опция принимается только прямоугольником.
            borderRadius: 6
        });
        areaLayout.push(myRectangle);
        map.geoObjects.add(myRectangle);
    })
}

function deleteAreasLayout(map) {
    areaLayout.forEach(layout => {
        map.geoObjects.remove(layout);
    });
    areaLayout = [];
}

function createSubareasLayout(map) {
    if (!$('#switchSubLayout').prop('checked')) return;
    areaBox.forEach(area => {
        area.sub.forEach(sub => {
            let color = getRandomColor();
            let myRectangle = new ymaps.Rectangle([
                // Задаем координаты диагональных углов прямоугольника.
                [sub.box.point0.Y, sub.box.point0.X],
                [sub.box.point1.Y, sub.box.point1.X]
            ], {
                //Свойства
                hintContent: 'Регион: ' + area.region + ', Область: ' + area.area + ', Подобласть:' + sub.subArea,
                balloonContent: 'azaza'
            }, {
                // Опции.
                // Цвет и прозрачность заливки.
                fillColor: color,
                // Дополнительная прозрачность заливки..
                // Итоговая прозрачность будет не #33(0.2), а 0.1(0.2*0.5).
                fillOpacity: 0.1,
                // Цвет обводки.
                strokeColor: color,
                // Прозрачность обводки.
                strokeOpacity: 0.5,
                // Ширина линии.
                strokeWidth: 2,
                // Радиус скругления углов.
                // Данная опция принимается только прямоугольником.
                borderRadius: 6
            });
            subareasLayout.push(myRectangle);
            map.geoObjects.add(myRectangle);
        })
    })
}

function deleteSubareasLayout(map) {
    subareasLayout.forEach(layout => {
        map.geoObjects.remove(layout);
    });
    subareasLayout = [];
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