'use strict';

ymaps.ready(function () {

    let IDs = [];
    let areaLayout = [];
    let subareasLayout = [];
    let regionInfo;
    let areaInfo;
    let areaZone;
    let boxRemember = {Y: 0, X: 0};
    let boxPoint = [];
    let fragments = [];
    let description = '';
    let tflights = [];
    let currentRouteTflights = new Map();
    let currListTL = [];
    let routeList = [];
    let allRoutesList = [];
    let lastRoute = {};
    let circlesMap = new Map();
    let zoom = 19;
    let fixationFlag = false;
    let creatingFlag = false;
    let executionFlag = false;
    let loopFuncMap = new Map();
    let sendedPhaseSave = new Map();
    let ws;

    function getRandomColor() {
        let letters = '0123456789A';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 11)];
        }
        return color;
    }

    function createCircle(region, area, id, description, coordinates) {
        // Создаем круг.
        let myCircle = new ymaps.Circle([
            // Координаты центра круга.
            coordinates,
            // Радиус круга в метрах.
            radiusCalculate(map.getZoom())
        ], {
            // Описываем свойства круга.
            // Содержимое балуна.
            // balloonContent: "Радиус круга - 10 км",
            // Содержимое хинта.
            hintContent: description
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

        circlesMap.set(JSON.stringify({region: region, area: area, id: id, description: description}), myCircle);
        if (circlesMap.size === 1) {
            $('#phaseTableButton').show();
            $('#createRouteButton')[0].disabled = false;
        }

        // Добавляем круг на карту.
        map.geoObjects.add(myCircle);
    }

    function deleteCircle(map, circle, pos, description) {
        map.geoObjects.remove(circle);
        circlesMap.delete(JSON.stringify(pos));
        routeList.forEach((route, index) => {
            if ((route.pos.region === pos.region) && (route.pos.area === pos.area) && (route.pos.id === pos.id)) routeList.splice(index, 1);
        });
        $('#table').bootstrapTable('remove', {field: 'desc', values: [description]});
        $('#navTable').bootstrapTable('remove', {field: 'tflight', values: [description]});

        makeSelects();
    }

    function deleteAllCircles() {
        circlesMap.forEach((value, key) => {
            map.geoObjects.remove(value);
            circlesMap.delete(key);
        });
    }

    function createIdeviceArray() {
        return Array.from(currentRouteTflights.values()).map(tfl => tfl.idevice)
    }

    function handlePhaseCommand(map, idevice) {
        let phase = -1;
        let dataArr = $('#table').bootstrapTable('getData');
        dataArr.forEach((tf, index) => {
            if (tf.idevice === idevice) phase = Number($('#cross' + index).val())
        });

        let navTable = $('#navTable').bootstrapTable('getData');
        let index = -1;
        navTable.forEach((row, rowIndex) => {
            if (row.idevice === idevice) index = rowIndex;
        });
        if (navTable.length > (index + 1)) $($('#navTable tbody tr')[index + 1]).trigger('click');

        if (executionFlag && (phase !== -1)) {
            if (!sendedPhaseSave.get(idevice)) {
                sendedPhaseSave.set(idevice, true);
                modifiedControlSend({id: idevice, cmd: 9, param: phase});
            }
        }
    }

    function handleClick(map, trafficLight, diffCoords) {
        let coordinates = (diffCoords === undefined) ? [trafficLight.points.Y, trafficLight.points.X] : diffCoords;
        let region = trafficLight.region.num;
        let area = trafficLight.area.num;
        let id = trafficLight.ID;
        let idevice = trafficLight.idevice;
        let description = trafficLight.description;
        let phases = trafficLight.phases;
        let returnFlag = false;

        if (!creatingFlag) {
            // map.setCenter(coordinates, 17);
            handlePhaseCommand(map, trafficLight.idevice);
            return;
        }

        circlesMap.forEach((value, keyJson) => {
            const key = JSON.parse(keyJson);
            if ((key.region === region) && (key.area === area) && (key.id === id)) {
                deleteCircle(map, value, key, description);
                returnFlag = true;
                if (circlesMap.size === 0) {
                    $('#phaseTableButton').hide();
                    $('#createRouteButton')[0].disabled = true;
                }
            }
        });

        if (returnFlag) return;

        if (routeList.length > 0) {
            if (routeList[routeList.length - 1].pos.region !== region) return;
        }

        routeList.push({
            num: routeList.length,
            phase: 1,
            point: {Y: coordinates[0], X: coordinates[1]},
            pos: {region: region, area: area, id: id}
        });

        createCircle(region, area, id, description, coordinates)

        //Заполнение структуры для дальнейшей записи в таблицу
        let tflight = [{
            state: false,
            desc: description,
            phase: phases,
            region: region,
            area: area,
            id: id,
            idevice: idevice
        }];

        $('#table').bootstrapTable('append', tflight).bootstrapTable('scrollTo', 'top');
        $('#navTable').bootstrapTable('append', {
            id: $('#navTable').bootstrapTable('getData').length + 1,
            tflight: description
        }).bootstrapTable('scrollTo', 'top');

        currListTL.push({pos: {region, area, id}});
        makeSelects();
    }

    function getPhases(index) {
        let rowData = $('#table').bootstrapTable('getData')[index];
        let returnData = {currPhase: -1, phases: []};

        tflights.some(trafficLight => {
            if ((trafficLight.region.num === rowData.region) && (trafficLight.area.num === rowData.area) && (trafficLight.ID === rowData.id)) {
                returnData.currPhase = (rowData.phase.length === 1) ? rowData.phase[0] : 1;
                returnData.phases = trafficLight.phases;
            }
        });

        return returnData;
    }

    function makeSelects() {
        $('#table tbody tr').each((i, tr) => {
            $(tr).find('td').each((j, td) => {
                if (td.cellIndex === 2) {
                    let phases = getPhases(tr.rowIndex - 1); // $(this)[0].innerText.split(',');
                    let optionsHtml = '';
                    phases.phases.forEach(phase => {
                        optionsHtml +=
                            `<option value="${phase}" ${((phase === phases.currPhase) ? ' selected="selected"' : '')}>${phase}</option>`;
                    });
                    $(td)[0].innerHTML = `<select id="cross${i}">${optionsHtml}</select>`;
                    $(`#cross${i}`).on('change', () => handleSelectChange(i));
                    handleSelectChange(i);
                }
            })
        })
    }

    function handleSelectChange(rowIndex, preventCycle) {
        const value = $('#cross' + rowIndex).val();
        let currTL = currListTL[rowIndex].pos;
        let currSvg = svg[currTL.region + '/' + currTL.area + '/' + currTL.id];
        if (routeList.length !== 0) {
            const index = routeList.findIndex(tf => JSON.stringify(tf.pos) === JSON.stringify(currTL));
            if (index !== -1) routeList[index].phase = Number(value);
        }
        if (currSvg === undefined) {
            if (preventCycle ?? false) return;
            setTimeout(() => handleSelectChange(rowIndex, true), 1000);
            return;
        }
        if (currSvg.find(phase => phase.num === value)?.phase === undefined) $('#cross' + rowIndex).closest('td').next('td')[0].innerHTML = '<td>-</td>';

        currSvg.forEach(pic => {
            if (pic.num === value) $('#cross' + rowIndex).closest('td').next('td')[0].innerHTML =
                `<td>` +
                `<svg width="100%" height="100%"` +
                `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;" xmlns="http://www.w3.org/2000/svg"` +
                `xmlns:xlink="http://www.w3.org/1999/xlink">` +
                `<image x="0" y="0" width="100%" height="100%"` +
                `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;"` +
                `xlink:href="data:image/png;base64,${pic.phase}"></image>` +
                `</svg>` +
                `</td>`
        })

        // todo Жду обновлённые картинки от Андрея
        // const value = $('#cross' + rowIndex).val();
        // $('#cross' + rowIndex).closest('td').next('td')[0].innerHTML = '<td>-</td>';
        // svg[rowIndex].forEach(pic => {
        //     if (pic._num === value) $('#cross' + rowIndex).closest('td').next('td')[0].innerHTML =
        //         `<td>` +
        //             `<svg width="100%" height="100%"` +
        //             `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;" xmlns="http://www.w3.org/2000/svg"` +
        //             `xmlns:xlink="http://www.w3.org/1999/xlink">` +
        //                 `<image x="0" y="0" width="100%" height="100%"` +
        //                 `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;"` +
        //                 `xlink:href="data:image/png;base64,${pic.__text}"></image>` +
        //             `</svg>` +
        //         `</td>`
        // })
    }

    function createRoute() {
        if (routeList.length === 0) return;
        // let selects = $('#table').find('select');
        //
        // routeList.map((route, index) => route.phase = Number(selects[index].selectedOptions[0].innerText));

        ws.send(JSON.stringify({
            type: 'createRoute',
            region: routeList[0].pos.region,
            description: description,
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
                return 400;
            case 12:
                return 300;
            case 13:
                return 250;
            case 14:
                return 200;
            case 15:
                return 150;
            case 16:
                return 100;
            case 17:
                return 75;
            case 18:
                return 50;
            case 19:
                return 40;
            default:
                return 30;
        }
    }

    function circlesControl(map) {
        if (zoom !== map.getZoom()) {
            circlesMap.forEach(circle => {
                map.geoObjects.remove(circle);
            });
            circlesMap.forEach(circle => {
                circle.geometry.setRadius(radiusCalculate(map.getZoom()));
                map.geoObjects.add(circle);
            });
            zoom = map.getZoom();
        }
    }

    let svg = {};
    function getPhasesSvg(trafficLights) {
        trafficLights.forEach((trafficLight, index) => {
            getSvg(trafficLight).then(svgData => {
                // todo Жду обновлённые картинки от Андрея
                // let x2js = new X2JS();
                // let data = x2js.xml2json(svgData);
                // svg.push(data.svg.mphase.phase)
                $('body').append('<div id="kostil" class="img-fluid" style="display: none" />');
                $('#kostil').prepend(svgData.children[0].outerHTML.replace('let currentPhase', 'var currentPhase'));

                const uniqueId = trafficLight.region + '/' + trafficLight.area + '/' + trafficLight.id;
                if (typeof getPhasesMass === "function") {
                    svg[uniqueId] = getPhasesMass()
                } else {
                    svg[uniqueId] = [];
                }

                if ((creatingFlag) && (svg[uniqueId] ?? true)) handleSelectChange(index);
                $('#kostil').remove();
            })
        });
    }

    function getSvg(trafficLight) {
        return new Promise(function (resolve) {
            $.ajax({
                url: window.location.origin + '/file/static/cross/' + trafficLight.region + '/' + trafficLight.area + '/' + trafficLight.id + '/cross.svg',
                type: 'GET',
                success: function (svgData) {
                    resolve(svgData)
                },
                error: function (request) {
                    console.log(request.status);
                    // alert(JSON.parse(request.responseText).message);
                }
            });
        })
    }

    function setRouteArea(map, box, description, routeId) {
        map.geoObjects.remove(lastRoute);
        let coordinates = [];
        let tableData = [];
        let navTableData = [];
        allRoutesList[routeId].listTL.forEach((tf, index) => {
            coordinates.push([tf.point.Y, tf.point.X]);
            tableData.push({
                desc: tf.description,
                phase: [tf.phase],
                region: tf.pos.region,
                area: tf.pos.area,
                id: tf.pos.id,
                idevice: findIdevice(tf.pos.region, tf.pos.area, tf.pos.id)
            });
            navTableData.push({
                id: index + 1,
                tflight: tf.description,
                idevice: findIdevice(tf.pos.region, tf.pos.area, tf.pos.id)
            });
        });

        // Построение маршрута.
        // По умолчанию строится автомобильный маршрут.
        let multiRoute = new ymaps.multiRouter.MultiRoute({
            // Точки маршрута. Точки могут быть заданы как координатами, так и адресом.
            referencePoints: coordinates
        }, {
            // Автоматически устанавливать границы карты так,
            // чтобы маршрут был виден целиком.
            boundsAutoApply: true,
            // Убрать видимость точек маршрута
            wayPointVisible: false,
        });

        lastRoute = multiRoute;
        map.geoObjects.add(multiRoute);

        getPhasesSvg(tableData)

        $('#table').bootstrapTable('load', tableData);
        $('#navTable').bootstrapTable('load', navTableData);
        makeSelects();
        $('#table tbody tr td').each((i, td) => {
            $(td).find('select option[selected=selected]').trigger('click');
        })
    }

    function findIndex(idevice) {
        if ($('#tableCol')[0].style.display === 'none') return -1;
        return $('#navTable').bootstrapTable('getData').findIndex(row => row.idevice === idevice);
    }

    function getStatus(position) {
        return tflights.find(element => (
            (element.region.num === position.region) && (element.area.num === position.area) && (element.ID === position.id)
        ))?.tlsost.num;
    }

    function distanceBetweenPoints(x1, y1, x2, y2) {
        return Math.sqrt((Math.pow((x2 - x1), 2) + (Math.pow((y2 - y1), 2))));
    }

    function findClosestTFLight(coords) {
        let closestTFLight = undefined;
        let x1 = coords[1];
        let y1 = coords[0];
        let minDistance = 0;
        tflights.forEach(tflight => {
            let x2 = tflight.points.X;
            let y2 = tflight.points.Y;
            let distance = distanceBetweenPoints(x1, y1, x2, y2);
            if ((minDistance === 0) || minDistance > distance) {
                minDistance = distance;
                closestTFLight = tflight;
            }
        });
        // console.log(minDistance);
        return closestTFLight;
    }

    function startCreating(flag) {
        flag ? $('#creatingModeButton').hide() : $('#creatingModeButton').show();
        flag ? $('#createRouteButton').show() : $('#createRouteButton').hide();
        $('#phaseTableButton').hide();
        $('#updateRouteButton').hide();
        $('#deleteRouteButton').hide();
        $('#startRouteButton').hide();
        $('#tableCol').hide();
        map.geoObjects.remove(lastRoute);
        if (!flag) {
            map.setBounds(boxPoint);
            // map.setBounds([
            //     [boxPoint.point0.Y, boxPoint.point0.X],
            //     [boxPoint.point1.Y, boxPoint.point1.X]
            // ]);
        }
        $('#table').bootstrapTable('removeAll');
        $('#navTable').bootstrapTable('removeAll');
        currListTL = [];
        creatingFlag = flag;
    }

    $('#tableCol').hide();
    $('#createRouteButton').hide();
    $('#phaseTableButton').hide();
    $('#deleteRouteButton').hide();
    $('#updateRouteButton').hide();
    $('#startRouteButton').hide();
    $('#endRouteButton').hide();

    $('#tableCol').parent().prepend('<div class="col-md-9 border border-dark" id="map" ' +
        `style="max-height: ${window.innerHeight * 0.85}px; min-height: ${window.innerHeight * 0.85}px;` +
        'position: relative; z-index: 1"></div>'
    )

    const mapSettings = JSON.parse(localStorage.getItem('mapSettings'));
    boxPoint = mapSettings.bounds;

    if ((localStorage.getItem('fragment') ?? '') !== '') {
        mapSettings.bounds = JSON.parse(localStorage.getItem('fragment'));
        localStorage.setItem('fragment', '');
    }
    //Создание и первичная настройка карты
    const map = new ymaps.Map('map', {
        bounds: mapSettings.bounds,
        zoom: mapSettings.zoom,
    });

    map.events.add(['click'], function (evt) {
        let coords = evt.getSourceEvent().get('coords');
        handleClick(map, findClosestTFLight(coords), coords);
    });

    map.events.add(['wheel', 'mousemove', 'click'], function () {
        circlesControl(map);
    });

    $('#map').on('mousedown', function (evt) {
        if (evt.which === 3) {
            let sended = false;
            sendedPhaseSave.forEach((value, key) => {
                if (value && !sended) {
                    sendedPhaseSave.set(key, false);
                    modifiedControlSend({id: key, cmd: 9, param: 9});
                    sended = true;
                }
            })
        }
    });

    $('#tableCol').find('div.fixed-table-body').css('max-height', window.innerHeight * 0.75)
    $('#phaseTableDialog').find('div.fixed-table-body').css('max-height', window.innerHeight * 0.6)

    $('#dropdownLayersButton').trigger('click');
    $('#dropdownControlButton').trigger('click');

    //Выбор места для открытия на карте
    $('#locationButton').on('click', function () {
        $('#locationDialog').dialog('open');
    });

    //Выбор фрагмента для открытия на карте
    $('#fragmentButton').on('click', function () {
        makeFragmentSelect();
        $('#fragmentDialog').dialog('open');
    });

    $('#phaseTableButton').on('click', function () {
        if (creatingFlag) getPhasesSvg($('#table').bootstrapTable('getData'))
        $('#phaseTableDialog').dialog('open');
    });

    $('#deleteButton').on('click', function () {
        const selectedRow = $('#table').bootstrapTable('getData').filter(row => row.state)[0];
        const pos = {region: selectedRow.region, area: selectedRow.area, id: selectedRow.id};
        const fullPos = {...pos, description: selectedRow.desc};
        map.geoObjects.remove(circlesMap.get(
            JSON.stringify(fullPos)
        ));
        circlesMap.delete(JSON.stringify(fullPos));
        if (circlesMap.size === 0) {
            $('#phaseTableButton').hide();
            $('#createRouteButton')[0].disabled = true;
            $('#phaseTableDialog').dialog('close');
        }
        delete svg[pos.region + '/' + pos.area + '/' + pos.id];
        currListTL = currListTL.filter(tl => JSON.stringify(tl.pos) !== JSON.stringify(pos))
        routeList = routeList.filter(tl => JSON.stringify(tl.pos) !== JSON.stringify(pos))
        $('#table').bootstrapTable('remove', {field: 'state', values: [true]});
        makeSelects();
    })

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

    $('#creatingModeButton').on('click', function () {
        $('#routeDesc').val('');
        startCreating(true);
        $('#createRouteButton')[0].disabled = true;
    });

    $('#createRouteButton').on('click', function () {
        $('#newRouteDialog').dialog('open');
    })

    $('#updateRouteButton').on('click', function () {
        const [region, desc] = $('#routes').val().split('---');
        const currRoute = allRoutesList.find(route => (route.region === region) && (route.description === desc));

        currRoute.listTL.map((tl, index) => tl.phase = Number($('#cross' + index).val()));

        ws.send(JSON.stringify({
            type: 'updateRoute',
            description: currRoute.description,
            region: currRoute.region,
            listTL: currRoute.listTL
        }))
    });

    $('#deleteRouteButton').on('click', function () {
        let [region, desc] = $('#routes').val().split('---');
        allRoutesList.forEach(route => {
            if ((route.region === region) && (route.description === desc)) {
                ws.send(JSON.stringify({type: 'deleteRoute', region: route.region, description: route.description}));
            }
        })
    });

    // Начало исполнения маршрута
    $('#startRouteButton').on('click', function () {
        $(this).hide();
        $('#routes')[0].disabled = true;
        executionFlag = true;
        $('#deleteRouteButton').hide();
        $('#updateRouteButton').hide();
        $('#endRouteButton').show();
        $($('#navTable tbody tr')[0]).trigger('click');
        ws.send(JSON.stringify({type: 'route', devices: createIdeviceArray(), turnOn: true}));
    });

    // Конец исполнения маршрута
    $('#endRouteButton').on('click', function () {
        $(this).hide();
        $('#routes')[0].disabled = false;
        executionFlag = false;
        $('#deleteRouteButton').show();
        $('#updateRouteButton').show();
        $('#startRouteButton').show();

        for (let [key, value] of loopFuncMap) {
            clearInterval(value);
            loopFuncMap.delete(key);
        }

        for (let [key] of sendedPhaseSave) modifiedControlSend({id: key, cmd: 9, param: 9});

        $('[id^=asterisk]').each((i, ast) => $(ast).css('color', 'black'))

        sendedPhaseSave = new Map();
        ws.send(JSON.stringify({type: 'route', devices: [], turnOn: false}));
    });

    $('#routes').on('change', function () {
        let [region, desc] = $('#routes').val().split('---');
        $('#endRouteButton').hide();

        sendedPhaseSave = new Map();
        svg = {};
        if ((region === '0') && (desc === '0')) {
            startCreating(false)
            return;
        }

        currListTL = allRoutesList.find(el => el.description === $('#routes').val().split('---')[1]).listTL;

        $('#tableCol').show();

        allRoutesList.forEach((route, index) => {
            if ((route.region === region) && (route.description === desc)) {
                currentRouteTflights = new Map();
                setRouteArea(map, route.box, route.description, index);
                map.geoObjects.each(object => {
                    if (object.geometry) {
                        if (route.listTL.some(tl => (JSON.stringify(tl.pos) === JSON.stringify(object.pos)))) {
                            currentRouteTflights.set(findIndex(object.idevice), object);
                        }
                    }
                });
                currentRouteTflights = new Map([...currentRouteTflights.entries()].sort());
                $('#navTable tbody tr').each((i, tr) => {
                    $(tr).on('click', () => {
                        map.setCenter(currentRouteTflights.get(tr.rowIndex - 1)?.geometry.getCoordinates(), zoom);
                    });
                    tr.cells[1].innerHTML = '<div class="placemark"  style="background-image:url(\'' + location.origin +
                        '/free/img/trafficLights/' + (getStatus(route.listTL[i].pos) ?? 'empty') + '.svg\');' +
                        'background-repeat: no-repeat; background-size: 50%; min-height: 50px;"><h2 id="asterisk' + i + '">*</h2></div>';
                });
            }
        });
        deleteAllCircles();
        $('#creatingModeButton').hide();
        $('#createRouteButton').hide();
        $('#phaseTableButton').show();
        $('#updateRouteButton').show();
        $('#deleteRouteButton').show();
        $('#startRouteButton').show();
        // routeStartFlag = true;
        creatingFlag = false;
    });

    let closeReason = '';
    ws = new WebSocket('wss://' + location.host + location.pathname + 'W');

    ws.onopen = function () {
        // on connecting, do nothing but log it to the console
        console.log('connected')
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
        // alert('Ошибка соединения: ' + closeReason);
    };

    ws.onerror = function (evt) {
        // alert(`Ошибка соединения WebSocket, ${evt.reason}`);
    }

    //Функция для обновления статусов контроллеров в реальном времени
    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        // console.log(data);
        // localStorage.setItem("maintab", "closed");
        switch (allData.type) {
            case 'mapInfo':
                map.container.fitToViewport()
                allRoutesList = data.routes;
                regionInfo = data.regionInfo;
                areaInfo = data.areaInfo;
                fragments = data.fragments;
                tflights = data.tflight;
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

                // boxPoint = data.boxPoint;
                // map.setBounds([
                //     [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                //     [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                // ]);

                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        hintContent: trafficLight.description
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }, trafficLight.tlsost.num),
                    });
                    placemark.pos = {region: trafficLight.region.num, area: trafficLight.area.num, id: trafficLight.ID};
                    placemark.idevice = trafficLight.idevice;
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function () {
                        handleClick(map, trafficLight);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });

                if ((data.routes.filter(route => route.region === data.routes[0].region)).length === data.routes.length) {
                    // Если только один регион
                    data.routes.forEach(route => {
                        $('#routes').append(new Option(route.description, route.region + '---' + route.description));
                    });
                } else {
                    // Больше одного региона
                    const optGroups = [];
                    Object.keys(data.regionInfo).forEach(region => {
                        optGroups.push(data.routes.filter(route => route.region === region))
                    });
                    optGroups.forEach(optGroup => {
                        if (optGroup.length === 0) return;
                        const label = data.regionInfo[Number(optGroup[0].region)];
                        $('#routes').append(`<optgroup label="${label}"></optgroup>`)
                        optGroup.forEach(opt => {
                            $(`optgroup[label~=${label}]`).append(new Option(opt.description, opt.region + '---' + opt.description))
                        })
                    })
                }
                break;
            case 'tflight':
                if ((data.tflight === null) || (regionInfo === undefined)) {
                    console.log((data.tflight === null) ? 'null' : 'mapInfo is not received at this moment');
                } else {
                    // console.log('Обновление');
                    //Обновление статуса контроллера происходит только при его изменении
                    data.tflight.forEach(trafficLight => {
                        const index = IDs.indexOf(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                        const placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                            hintContent: trafficLight.description
                        }, {
                            iconLayout: createChipsLayout(function (zoom) {
                                // Размер метки будет определяться функией с оператором switch.
                                return calculate(zoom);
                            }, trafficLight.tlsost.num)
                        });
                        placemark.events.add('click', function () {
                            handleClick(map, trafficLight);
                        });
                        //Замена метки контроллера со старым состоянием на метку с новым
                        map.geoObjects.splice(index, 1, placemark);

                        tflights.forEach((tflight, index) => {
                            if ((tflight.region.num === trafficLight.region.num) &&
                                (tflight.area.num === trafficLight.area.num) && (tflight.ID === trafficLight.ID)) {
                                tflights[index].tlsost = trafficLight.tlsost;
                            }
                        });

                        let tableIndex = findIndex(trafficLight.idevice);
                        if (tableIndex !== -1) {
                            $('#navTable tbody tr').each((i, tr) => {
                                if (i === tableIndex) {
                                    $(tr.cells[1]).children().closest('div').css('background-image',
                                        `url('${location.origin}/free/img/trafficLights/${trafficLight.tlsost.num}.svg')`)
                                    asteriskControl($('#navTable').bootstrapTable('getData')[i].idevice, true)
                                }
                            });
                        }
                    })
                }
                break;
            case 'repaint': {
                let execWaiter = setInterval(() => {
                    if (!executionFlag) {
                        map.geoObjects.removeAll();
                        //Разбор полученной от сервера информации
                        data.tflight.forEach(trafficLight => {
                            IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                            //Создание меток контроллеров на карте
                            let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                                hintContent: trafficLight.description
                            }, {
                                iconLayout: createChipsLayout(function (zoom) {
                                    // Размер метки будет определяться функией с оператором switch.
                                    return calculate(zoom);
                                }, trafficLight.tlsost.num),
                            });
                            placemark.pos = {
                                region: trafficLight.region.num,
                                area: trafficLight.area.num,
                                id: trafficLight.ID
                            };
                            //Функция для вызова АРМ нажатием на контроллер
                            placemark.events.add('click', function () {
                                handleClick(map, trafficLight);
                            });
                            //Добавление метки контроллера на карту
                            map.geoObjects.add(placemark);
                        });
                        areaZone = data.areaZone;
                        createAreasLayout(map);
                        clearInterval(execWaiter);
                    }
                }, 5000);
                break;
            }
            case 'jump':
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);
                break;
            case 'phases': {
                const tableData = $('#navTable').bootstrapTable('getData');
                tableData.forEach((row, rowIndex) => {
                    data.phases.forEach(phaseRow => {
                        if (phaseRow.device === row.idevice) {

                            let currTL = currListTL[rowIndex].pos;
                            let currSvg = svg[currTL.region + '/' + currTL.area + '/' + currTL.id];

                            $('#navTable tbody tr')[rowIndex].cells[2].innerHTML =
                                (phaseRow.phase === 9) ? 'Пром. такт' :
                                    ((currSvg.find(phase => phase.num === phaseRow.phase.toString())?.phase) === undefined) ? `Отсутствует картинка фазы (${phaseRow.phase})` :
                                        `<svg width="100%" height="100%" ` +
                                        `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;" xmlns="http://www.w3.org/2000/svg" ` +
                                        `xmlns:xlink="http://www.w3.org/1999/xlink"> ` +
                                        `<image x="0" y="0" width="100%" height="100%" ` +
                                        `style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;" ` +
                                        `xlink:href="data:image/png;base64,${currSvg.find(phase => phase.num === phaseRow.phase.toString()).phase}"></image>` +
                                        `</svg>`
                        }
                    })
                });
                break;
            }
            case 'createRoute':
                if (data.error) {
                    // alert(data.error);
                    return;
                }
                allRoutesList.push(data.route);

                $(`optgroup[label~="${regionInfo[Number(data.route.region)]}"]`).append(
                    new Option(data.route.description, data.route.region + '---' + data.route.description)
                )

                if (data.login === localStorage.getItem('login')) {
                    $('#routes option[value=' + data.route.region + '---' + data.route.description + ']').attr('selected', 'selected');
                    $('#routes').change();

                    deleteAllCircles()
                    // map.setBounds([
                    //     [data.route.box.point0.Y, data.route.box.point0.X],
                    //     [data.route.box.point1.Y, data.route.box.point1.X]
                    // ]);
                    // setRouteArea(map, data.route.box, data.route.description, allRoutesList.length - 1);
                    //
                    // $('#creatingModeButton').hide();
                    // $('#tableCol').show();
                    // $('#updateRouteButton').show();
                    // $('#deleteRouteButton').show();
                    // $('#startRouteButton').show();
                    creatingFlag = false;
                }
                break;
            case 'deleteRoute':
                $("#routes option[value='" + data.route.region + '---' + data.route.description + "']").remove();
                map.geoObjects.remove(lastRoute);
                map.setBounds(boxPoint);
                // map.setBounds([
                //     [boxPoint.point0.Y, boxPoint.point0.X],
                //     [boxPoint.point1.Y, boxPoint.point1.X]
                // ]);
                $('#table').bootstrapTable('removeAll');
                $('#navTable').bootstrapTable('removeAll');
                $('#tableCol').hide();
                $('#routes').change();
                routeList = [];
                break;
            case 'error':
                closeReason = data.message;
                ws.close(1000);
                break;
            case 'close':
                // closeReason = 'WS Closed by server';
                ws.close(1000);
                window.close();
                break;
        }
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
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

    $('#fragmentDialog').dialog({
        autoOpen: false,
        buttons: {
            'Открыть': function () {
                const [x1, y1, x2, y2] = $('#fragment')[0].value.split(',').map(el => Number(el));
                const bounds = [[x1, y1], [x2, y2]];
                map.setBounds(bounds);

                $(this).dialog('close');
            },
            'Открыть в новой вкладке': function () {
                const [x1, y1, x2, y2] = $('#fragment')[0].value.split(',').map(el => Number(el));
                const bounds = [[x1, y1], [x2, y2]];
                localStorage.setItem('fragment', JSON.stringify(bounds))
                window.open(location.href);
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        minWidth: 480,
        modal: true,
        resizable: false
    });

    $('#phaseTableDialog').dialog({
        autoOpen: false,
        buttons: {
            'Ок': function () {
                // if (!creatingFlag) $('#updateRouteButton').trigger('click');
                $(this).dialog('close');
            },
            'Отмена': function () {
                if (creatingFlag) {
                    $(this).dialog('close');
                    return;
                }
                const [region, desc] = $('#routes').val().split('---');
                const currRoute = allRoutesList.find(route => (route.region === region) && (route.description === desc));
                currRoute.listTL.map((tl, index) => $('#cross' + index).val(tl.phase).trigger('change'));
                $(this).dialog('close');
            }
        },
        minWidth: 1000,
        height: window.innerHeight * 0.9,
        modal: true,
        resizable: false
    });

    $('#newRouteDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                description = $('#routeDesc').val();
                createRoute();
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

    function makeFragmentSelect() {
        const fragmentSelect = $('#fragment');
        $('#fragment option').remove();
        if (fragments ?? false) {
            fragments.forEach(fragment => fragmentSelect.append(new Option(fragment.name, fragment.bounds)))
        } else {
            $('#fragment').append(new Option('Фрагменты отсутствуют', map.getBounds()))
        }
    }

    function findIdevice(region, area, id) {
        let idevice = -1;
        tflights.forEach(tf => {
            if ((tf.region.num === region) && (tf.area.num === area) && (tf.ID === id)) idevice = tf.idevice
        });
        return idevice;
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
            let polygon = convexHullTry(map, area.zone, 'Регион: ' + area.region + ', Район: ' + area.area);
            areaLayout.push(polygon);
        })
    }

    function deleteAreasLayout(map) {
        areaLayout.forEach(layout => map.geoObjects.remove(layout));
        areaLayout = [];
    }

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

    function convexHullTry(map, coordinates, description) {
        let color = getRandomColor();

        // Создаем многоугольник, используя вспомогательный класс Polygon.
        var myPolygon = new ymaps.Polygon([
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

    function asteriskControl(idevice, sended) {
        $('#asterisk' + findIndex(idevice)).css('color', sended ? 'green' : 'red');
    }

    function modifiedControlSend(toSend) {
        let loopFunc;
        if (loopFuncMap.get(toSend.id)) {
            clearInterval(loopFuncMap.get(toSend.id));
            loopFuncMap.set(toSend.id, undefined)
        }

        controlSend(toSend);

        if (toSend.param !== 9) {
            loopFunc = window.setInterval(function () {
                controlSend(toSend);
            }, 60000);
            loopFuncMap.set(toSend.id, loopFunc);
        }

        asteriskControl(toSend.id, false);
    }

//Отправка выбранной команды на сервер
    function controlSend(toSend) {
        ws.send(JSON.stringify({type: 'dispatch', id: toSend.id, cmd: toSend.cmd, param: toSend.param}));
    }
});
