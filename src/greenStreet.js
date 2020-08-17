'use strict';

let currnum = -1;
let IDs = [];
let areaLayout = [];
let subareasLayout = [];
let regionInfo;
let areaInfo;
let areaZone;
let boxRemember = {Y: 0, X: 0};
let description = '';
let routeList = [];
let routeListLength = 0;
let allRoutesList = [];
let lastRoute = {};
let circlesList = [];
let zoom = 19;
// let tflights = [];
// let login = '';
let fixationFlag = false;
let ws;

function getRandomColor() {
    var letters = '0123456789A';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 11)];
    }
    return color;
}


function handleClick(map, trafficLight) {
    let coordinates = [trafficLight.points.Y, trafficLight.points.X];
    let region = trafficLight.region.num;
    let area = trafficLight.area.num;
    let id = trafficLight.ID;
    let description = trafficLight.description;
    let phases = trafficLight.phases;
    let dupCheck = false;

    routeList.forEach(route => {
        if ((route.pos.region === region) && (route.pos.area === area) && (route.pos.id === id)) dupCheck = true;
    });
    if (dupCheck) return;

    if (routeListLength > 0) {
        if (routeList[routeListLength - 1].pos.region !== region) return;
    }

    routeList.push({
        num: routeListLength++,
        phase: -1,
        point: {Y: coordinates[0], X: coordinates[1]},
        pos: {region: region, area: area, id: id}
    });

    // Создаем круг.
    let myCircle = new ymaps.Circle([
        // Координаты центра круга.
        coordinates,
        // Радиус круга в метрах.
        radiusCalculate(map._zoom)
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

    //Заполнение структуры для дальнейшей записи в таблицу
    let tflight = [{
        desc: description,
        phase: phases,
        id: routeListLength - 1
        // pos: {region: region, area: area, id: id}
    }];

    $('#table').bootstrapTable('append', tflight);
    $('#table').bootstrapTable('scrollTo', 'top');

    makeSelects();
}

function makeSelects() {
    let counter = 0;
    $('#table tbody tr').each(function () {
        counter = 0;
        $(this).find('td').each(function () {
            if ((counter++ % 2) !== 0) {
                let phases = $(this)[0].innerText.split(',');
                let selectTxt = '';
                phases.forEach(phase => {
                    selectTxt += '<option value="' + phase + '">' + phase + '</option>';
                });
                $(this)[0].innerText = '';
                $(this)[0].innerHTML = '<select>' + selectTxt + '</select>';
            }
        })
    })
}

function fillPhases() {
    if (routeListLength === 0) return;
    let selects = $('#table').find('select');
    let counter = 0;
    routeList.slice().forEach(route => {
        route.phase = Number(selects[counter].selectedOptions[0].innerText);
        routeList[counter++] = route;
    });
    ws.send(JSON.stringify({
        type: 'createRoute',
        description: description,
        region: routeList[0].pos.region,
        listTL: routeList
    }))
}

function radiusCalculate(zoom) {
    switch (zoom) {
        case 3:
            return 32000;
        case 4:
            return 16000;
        case 5:
            return 8000;
        case 6:
            return 4000;
        case 7:
            return 2000;
        case 8:
            return 1000;
        case 9:
            return 750;
        case 10:
            return 500;
        case 11:
            return 300;
        case 12:
            return 200;
        case 13:
            return 150;
        case 14:
            return 130;
        case 15:
            return 100;
        case 16:
            return 60;
        case 17:
            return 40;
        case 18:
            return 30;
        case 19:
            return 25;
        default:
            return 20;
    }
}

function circlesControl(map) {
    if (zoom !== map._zoom) {
        circlesList.forEach(circle => {
            map.geoObjects.remove(circle);
        });
        circlesList.forEach(circle => {
            circle.geometry.setRadius(radiusCalculate(map._zoom));
            map.geoObjects.add(circle);
        });
        zoom = map._zoom;
    }
}

function setRouteArea(map, box, description, routeId) {
    map.geoObjects.remove(lastRoute);
    let coordinates = [];
    allRoutesList[routeId].listTL.forEach(tf => {
        coordinates.push([tf.point.Y, tf.point.X])
    });

    // Построение маршрута.
    // По умолчанию строится автомобильный маршрут.
    let multiRoute = new ymaps.multiRouter.MultiRoute({
        // Точки маршрута. Точки могут быть заданы как координатами, так и адресом.
        referencePoints:
        coordinates
    }, {
        // Автоматически устанавливать границы карты так,
        // чтобы маршрут был виден целиком.
        boundsAutoApply: true
    });

    lastRoute = multiRoute;
    map.geoObjects.add(multiRoute);
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

    map.events.add(['wheel', 'mousemove', 'click'], function () {
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

    $('#sendRouteButton').on('click', function () {
        $('#newRouteDialog').dialog('open');
    });

    $('#routes').on('change', function () {
        let counter = 0;
        let selected = Number($(this)[0].selectedOptions[0].value);
        allRoutesList.forEach(route => {
            if (route.id === selected) setRouteArea(map, route.box, route.description, counter);
            counter++;
        });
    });

    ws = new WebSocket('ws://' + location.host + location.pathname + 'W');

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
                allRoutesList = data.routes;
                regionInfo = data.regionInfo;
                areaInfo = data.areaInfo;
                // tflights = data.tflight;
                if ((areaZone === undefined) && (data.areaZone !== undefined)) {
                    areaZone = data.areaZone;
                    createAreasLayout(map);
                }
                // convexHullTry(map, data.hull);
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
                        handleClick(map, trafficLight);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });

                data.routes.forEach(route => {
                    $('#routes').append(new Option(route.description, route.id));
                });
                // .append(new Option(regionInfo[reg], reg));
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
                            handleClick(map, trafficLight);
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
                        handleClick(map, trafficLight);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });
                areaZone = data.areaZone;
                createAreasLayout(map);
                break;
            case 'jump':
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);
                break;
            case 'createRoute':
                if (data.error) {
                    alert(data.error);
                    return;
                }
                $('#routes').append(new Option(data.route.description, data.route.id));
                $('#routes option[value=' + data.route.id + ']').attr('selected', 'selected');

                allRoutesList.push(data.route);
                setRouteArea(map, data.route.box, data.route.description, allRoutesList.length - 1);
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

    $('#newRouteDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                description = $('#routeDesc').val();
                fillPhases();
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
        // case 11:
        //     return 5;
        // case 12:
        //     return 10;
        // case 13:
        //     return 20;
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
            return 20;
        // return 80;
    }
};

function createAreasLayout(map) {
    if (!$('#switchLayout').prop('checked')) return;
    areaZone.forEach(area => {
        let polygon = convexHullTry(map, area.zone, 'Регион: ' + area.region + ', Область: ' + area.area);
        areaLayout.push(polygon);
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
    areaZone.forEach(area => {
        area.sub.forEach(sub => {
            let polygon = convexHullTry(map, sub.zone, 'Регион: ' + area.region + ', Область: ' + area.area + ', Подобласть:' + sub.subArea);
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

function convexHullTry(map, coords, description) {
    let color = getRandomColor();
    let coordinates = [];
    coords.forEach(point => {
        coordinates.push([point.Y, point.X]);
    });
    // Создаем многоугольник, используя вспомогательный класс Polygon.
    var myPolygon = new ymaps.Polygon([
        // Указываем координаты вершин многоугольника.
        // Координаты вершин внешнего контура.
        coordinates,
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