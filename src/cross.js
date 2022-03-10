//todo если есть подрайон (!=0), по изменению карт предлагать поменять во всём подрайоне

'use strict';

let ID = 0;
let loopFunc;
let phaseFlags = [];
let editFlag = false;
let control;
let idevice = undefined;
let ws;
let model;

$(function () {
    let closeReason = '';
    ws = new WebSocket('wss://' + location.host + location.pathname + 'W' + location.search);

    ws.onopen = function () {
        console.log('connected');
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
        // alert('Ошибка соединения: ' + closeReason);
    };

    ws.onerror = function (evt) {
        // alert(`Ошибка соединения WebSocket, ${evt.reason}`);
    }

    let $table = $('#expandedTable');
    $table.bootstrapTable();

    $('#img1').on('click', function () {
        $('#check').trigger('click');
    });

    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        let counter = 0;
        switch (allData.type) {
            case 'crossBuild': {
                let state = data.state;
                let cross = data.cross;
                let controlCrossFlag = data.access[4];
                let region = data.cross.region.num;
                let area = data.cross.area.num;
                model = state.Model;
                ID = data.cross.ID;
                idevice = data.state.idevice;
                editFlag = data.edit;
                document.title = 'ДК-' + ID;

                $('#connection')[0].innerText = data.scon ? data.eth ? 'LAN' : 'GPRS' : '';

                $('#deviceLog').width($('#ky').width());
                $(window).resize(() => {
                    $('#deviceLog').width($('#ky').width());
                });
                // if (editFlag) controlSend({id: idevice, cmd: 4, param: 1});

                // $(window).on("beforeunload", function () {
                //     if (editFlag) controlSend({id: idevice, cmd: 4, param: 0});
                // });

                if (data.dk.edk === 1) {
                    $('#transition').show();
                    // $('#status').hide();
                } else {
                    $('#transition').hide();
                    // $('#status').show();
                }
                if (controlCrossFlag) {
                    $('a').each(function () {
                        $(this).show();
                    });
                    $('#controlButton').show();
                }

                // console.log(data);

                //Отображение полученных данных на экране АРМа
                $('#description').html(data.state.name);

                counter = 0;

                $('select').each(function () {
                    checkSelect($(this), controlCrossFlag);
                });

                //TODO uncomment
                //Добавление режима движения и подложки в виде участка карты
                // $('#img').attr('src', window.location.origin + '/file/static/cross/' + region + '/' + area + '/' + ID + '/cross.svg')
                //     .attr('style', 'background-size: cover; background-image: url(' + window.location.origin + '/file/static/cross/' + region + '/' + area + '/' + ID + '/map.png' + '); background-repeat: no-repeat;');
                $('#img').hide();
                $.ajax({
                    url: window.location.origin + '/file/static/cross/' + region + '/' + area + '/' + ID + '/cross.svg',
                    type: 'GET',
                    success: function (svgData) {
                        // console.log(svgData);
                        // $('div[class="col-sm-3 text-left mt-3"]').prepend(svgData.children[0].outerHTML);
                        $('#img-col').prepend(svgData.children[0].outerHTML);
                        $('svg').each(function (index) {
                            $(this).attr('id', 'svg' + index);
                        });
                        $('#svg0').attr('width', $('#img-col')[0].offsetWidth);

                        $(window).on('resize', () => $('#svg0').attr('width', $('#img-col')[0].offsetWidth));
                        //     .append('<a class="btn btn-light border" id="secret" data-toggle="tooltip" title="Включить 1 фазу" role="button"\n' +
                        //         '        onclick="setPhase(randomInt(1, 12))"><img class="img-fluid" src="/file/static/img/buttons/p1.svg" height="50" alt="1 фаза"></a>');
                        // $('#secret').hide();

                        // $('svg').each(function () {
                        //     $(this).attr('id', 'svg' + counter++);
                        //     // $(this).attr('height', '450');
                        // });
                        // $('#svg0').attr('height', '450');
                        // $('#svg0').attr('width', '450');

                        // $('#svg0').attr('height', '100%')
                        //                 .attr('width', '100%')
                        //                 .attr('style', 'max-height: 450px; max-width: 450px; min-height: 250px; min-width: 250px;');
                        // $('image[height^="450"]').attr('height', '100%')
                        //                                .attr('width', '100%')
                        //                                .attr('style', 'max-height: 450px; max-width: 450px; min-height: 225px; min-width: 225px;');
                        // $('svg[height^="140"]').each(function () {
                        //      $(this).attr('height', '36%')
                        //             .attr('width', '36%')
                        //             .attr('style', 'max-height: 140px; max-width: 140px; min-height: 75px; min-width: 75px;');
                        // });

                        const phases = data.phases.slice().sort((a, b) => b - a);
                        if (typeof getPhasesMass === "function") {
                            const svgPhases = getPhasesMass();
                            phases.forEach(phase => {
                                if (svgPhases.map(svg => Number(svg.num)).includes(phase)) {
                                    $('#buttons')
                                        .prepend(
                                            `<a class="btn btn-light border disabled" id="p${phase}" 
                                            data-toggle="tooltip" title="Включить ${phase} фазу" role="button">       
                                                <svg id="example1" width="100%" height="100%" style="max-height: 50px;            
                                                max-width: 50px; min-height: 30px; min-width: 30px;"           
                                                xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">           
                                                    <image x="0" y="0" width="100%" height="100%" style="max-height: 50px;            
                                                    max-width: 50px; min-height: 30px; min-width: 30px;"             
                                                    xlink:href="data:image/png;base64,${svgPhases.find(svg => Number(svg.num) === phase).phase}"/>       
                                                </svg>
                                            </a>`
                                        );
                                } else {
                                    $('#buttons')
                                        .prepend('<a class="btn btn-light border disabled" id="p' + phase + '" data-toggle="tooltip" title="Включить ' + phase + ' фазу"'
                                            + ' role="button"><img class="img-fluid" src="/file/static/img/buttons/' + phase + '.svg" height="50"'
                                            + '  alt="Фаза "' + phase + '></a>');
                                }
                            })
                        } else {
                            phases.forEach(phase => {
                                $('#buttons')
                                    .prepend('<a class="btn btn-light border mt-2 disabled" id="p' + phase + '" data-toggle="tooltip" title="' + phase + '"'
                                        + ' role="button"><img class="img-fluid" src="/file/static/img/buttons/' + phase + '.svg" height="50"'
                                        + '  alt="Фаза "' + phase + '></a>');
                            })
                        }

                        if (typeof hasCam === 'function') {
                            if (hasCam()) {
                                $('#crossCameras').show().on('click', () => {
                                    // localStorage.setItem('ID', cross.ID);
                                    // localStorage.setItem('area', cross.area.num);
                                    // localStorage.setItem('region', cross.region.num);
                                    // window.open(window.location.origin + '/user/' +
                                    //     localStorage.getItem('login') + '/cameras');
                                    window.open(window.location.href.replace('cross', 'cameras'))
                                });
                            }
                        }

                        $('a').each(function () {
                            let id = $(this).attr('id');
                            this.className = checkButton(this.className.toString(), controlCrossFlag);
                            if (!id.includes('p')) {
                                $('#' + id).on('click', function () {
                                    buttonClick(id, state.idevice);
                                })
                            }
                        });

                        //Начало и остановка отправки фаз на контроллер
                        $('a').each(function () {
                            phaseFlags.push(false);
                            $(this).on('click', function () {
                                let id = $(this)[0].id;
                                stopSendingCommands(id);
                                if (!id.includes('p')) return;
                                phaseFlags[Number(id.substring(1)) - 1] = !phaseFlags[Number(id.substring(1)) - 1];
                                let flag = phaseFlags[Number(id.substring(1)) - 1];
                                flag ? $(this).attr('style', ' background-color: #cccccc;') : $(this).attr('style', ' background-color: #f8f9fa;');
                                clearInterval(loopFunc);
                                loopFunc = undefined;
                                if (flag) {
                                    buttonClick(id, state.idevice);
                                    loopFunc = window.setInterval(function () {
                                        buttonClick(id, state.idevice);
                                    }, 60000);
                                }
                            });
                        });
                        checkEdit();
                        checkConnection(cross.tlsost.control, data.dk.fdk);
                    },
                    error: function (request) {
                        console.log(request.status + ' ' + request.responseText);
                        // alert(JSON.parse(request.responseText).message);
                    }
                });

                if ($('#expandedTable').length === 0) $('[class~=no-records-found] td').text('Ожидание Пром. такта');
                buildExpandedTable(data.dk);

                /*
                <a class="btn btn-light border disabled" id="p1" data-toggle="tooltip" title="Включить 1 фазу" role="button"
               style="display: none;"><img class="img-fluid" src="/file/img/buttons/p1.svg" height="50" alt="1 фаза"></a>
                */
                //---------------------------------------------------------------------------------------------------------------------------------------------------
                $('#status').html('Статус: ' + data.cross.tlsost.description);
                if (data.techMode !== undefined) $('#techMode').html('Технология: ' + data.techMode);

                $('#deviceLog').on('click', () => {
                    localStorage.setItem('ID', cross.ID);
                    localStorage.setItem('area', cross.area.num);
                    localStorage.setItem('region', cross.region.num);
                    localStorage.setItem('description', cross.description);
                    window.open(window.location.origin + '/user/' + localStorage.getItem('login') + '/deviceLog');
                });

                $('#controlButton').on('click', function () {
                    window.open(window.location.origin + window.location.pathname + '/control' + window.location.search, idevice);
                });

                //Проверка существования карт и добавление их выбора
                counter = 0;
                data.state.arrays.SetDK.dk.forEach(tab => {
                    $('#pk').append(new Option('ПК ' + (++counter), counter));
                });
                $('#pk option[value=' + data.state.pk + ']').attr('selected', 'selected');

                counter = 0;
                data.state.arrays.DaySets.daysets.forEach(rec => {
                    if (rec.lines[0].npk !== 0) {
                        $('#sk').append(new Option('CК ' + (counter + 1), counter + 1));
                    }
                    counter++;
                });
                $('#sk option[value=' + data.state.ck + ']').attr('selected', 'selected');

                counter = 0;
                data.state.arrays.WeekSets.wsets.forEach(rec => {
                    let flag = true;
                    rec.days.forEach(day => {
                        if (rec.days[day] === 0) flag = false;
                    });
                    if (flag) $('#nk').append(new Option('НК ' + (counter + 1), counter + 1));
                    counter++;
                });
                $('#nk option[value=' + data.state.nk + ']').attr('selected', 'selected');
                $('#pk').on('change keyup', function () {
                    selectChange('#pk', data.state.idevice);
                });
                $('#sk').on('change keyup', function () {
                    selectChange('#sk', data.state.idevice);
                });
                $('#nk').on('change keyup', function () {
                    selectChange('#nk', data.state.idevice);
                });
                break;
            }
            case 'changeEdit':
                // console.log('edit:' + data.edit);
                editFlag = data.edit;
                // if (editFlag) controlSend({id: idevice, cmd: 4, param: 1});
                checkEdit();
                checkConnection();
                break;
            case 'dispatch': {
                // console.log('dispatch', data);
                let time = new Date();
                let strTime = '';
                strTime += (time.getHours().toString().length === 2) ? time.getHours() : '0' + time.getHours();
                strTime += (':');
                strTime += (time.getMinutes().toString().length === 2) ? time.getMinutes() : '0' + time.getMinutes();
                strTime += (':');
                strTime += (time.getSeconds().toString().length === 2) ? time.getSeconds() : '0' + time.getSeconds();
                if (!data.status) {
                    $('#verification').bootstrapTable('prepend', {
                        status: 'Отсутствует связь с сервером',
                        time: strTime,
                        user: data.user
                    }).find('tbody').find('tr').find('td').each(function () {
                        // if (Math.abs(counter++ % 3) === 1) {
                        $(this).attr('class', 'text-left');
                        // }
                    }).bootstrapTable('scrollTo', 'top');
                    return;
                }
                counter = 0;
                // let message = JSON.parse(data.message.substring(data.message.indexOf('{'), data.message.lastIndexOf('}') + 1));
                let msg = getDescription(data.command);

                $('#verification').bootstrapTable('prepend', {
                    status: msg,
                    time: strTime,
                    user: data.command.user
                }).find('tbody').find('tr').find('td').each(function () {
                    // if (Math.abs(counter++ % 3) === 1) {
                    $(this).attr('class', 'text-left');
                    // }
                }).bootstrapTable('scrollTo', 'top');
                break;
            }
            case 'crossUpdate':
                // console.log('crossUpdate', data);
                $('#status').html('Статус: ' + data.status.description);
                $('#pk').find('option').each(function () {
                    $(this).removeAttr('selected');
                });
                $('#sk').find('option').each(function () {
                    $(this).removeAttr('selected');
                });
                $('#nk').find('option').each(function () {
                    $(this).removeAttr('selected');
                });

                $('#pk option[value=' + data.state.pk + ']').attr('selected', 'selected');
                $('#sk option[value=' + data.state.ck + ']').attr('selected', 'selected');
                $('#nk option[value=' + data.state.nk + ']').attr('selected', 'selected');

                $('#sfdk').remove();
                if (!data.sfdk) $('#connection').parent().append('<div id="sfdk">Отключена передача фаз</div>');

                checkConnection(data.status.control);
                break;
            case 'stateChange':
                $('#description').html(data.state.name);
                $('#pk').val(data.state.pk)
                $('#sk').val(data.state.ck)
                $('#nk').val(data.state.nk)
                break;
            case 'crossConnection':
                $('#connection')[0].innerText = data.scon ? data.eth ? 'LAN' : 'GPRS' : '';
                break;
            case 'phase':
                // TODO сделать вывод в читаемом формате только для нас
                // console.log('phase ', data);
                //Обработка таблицы
                if ($('#expandedTable')[0].style.display === 'none') $('#expandedTable').show();
                if ($('#phase')[0].style.display === 'none') $('#phase').show();
                if (data.techMode !== undefined) $('#techMode').html('Технология: ' + data.techMode);

                buildExpandedTable(data.dk);

                if ($('#ddk').length === 0) $('#phase').append('<br> <label class="mt-3" id="ddk"></label>');
                if (data.dk.ddk <= 5) {
                    let ddk = '';
                    switch (data.dk.ddk) {
                        case 1:
                            ddk = 'ДК';
                            break
                        case 2:
                            ddk = 'ВПУ';
                            break
                        case 3:
                            ddk = 'ИП УСДК';
                            break
                        case 4:
                            ddk = "УСДК"
                            if (model.C12) ddk = "C12"
                            if (model.DKA) ddk = "ДКА"
                            if (model.DTA) ddk = "ДТА"
                            break
                        case 5:
                            ddk = 'ИП ДКА';
                            break
                    }
                    $('#ddk').text(ddk);
                }

                if (data.dk.edk === 1) {
                    $('#transition').show();
                    // $('#status').hide();
                } else {
                    $('#transition').hide();
                    // $('#status').show();
                }
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
                console.log('unknown command');
                break;
        }
    };

    $('#verification').bootstrapTable('removeAll');
});

let fakeTimer;
const maxTableSize = 12;
let currentIndex = 0;
let prevIndex = 0;
let prevPhase = -1;

function buildExpandedTable(data) {
    let $expandedTable = $('#expandedTable');

    let dataArr = $expandedTable.bootstrapTable('getData').slice();

    let toWrite = {
        column1: ((data.fdk >= 9) || (dataArr.length === 0) || (dataArr[currentIndex] === undefined)) ?
            data.ftudk : dataArr[currentIndex].column1,
        column2: ((data.fdk >= 9) || (dataArr.length === 0) || (dataArr[currentIndex] === undefined)) ?
            data.tdk : dataArr[currentIndex].column2,
        column3: 0,
        column4: data.fdk,
        column5: ((data.fdk === 9) || (dataArr.length === 0) || (dataArr[currentIndex] === undefined)) ?
            0 : (dataArr[currentIndex].column2 - dataArr[prevIndex].column2),
        column6: 0,
        column7: 0
    };

    if (toWrite.column5 < 0) toWrite.column5 = 0;

    if (prevPhase === toWrite.column4) return;
    prevPhase = toWrite.column4;

    // if ($expandedTable.bootstrapTable('getData').length !== 0) toWrite.column2 = dataArr[prevIndex].column2;
    switch (toWrite.column1) {
        case 0:
            toWrite.column1 = 'ЛР';
            break;
        case 10:
        case 14:
            toWrite.column1 = 'ЖМ';
            break;
        case 11:
        case 15:
            toWrite.column1 = 'ОС';
            break;
        case 12:
            toWrite.column1 = 'КК';
            break;
        default:
            break;
    }

    switch (toWrite.column4) {
        case 0:
            toWrite.column4 = 'ЛР';
            break;
        case 9:
            toWrite.column4 = 'Пром. такт';
            toWrite.column2 = data.tdk;
            break;
        case 10:
        case 14:
            toWrite.column4 = 'ЖМ';
            break;
        case 11:
        case 15:
            toWrite.column4 = 'ОС';
            break;
        case 12:
            toWrite.column4 = 'КК';
            break;
        default:
            // if ($expandedTable.bootstrapTable('getData').length !== 0) toWrite.column2 = data.tdk - dataArr[prevIndex].column3;
            break;
    }

    // if (($expandedTable.bootstrapTable('getData').length !== 0) && (toWrite.column4 !== 'Пром. такт')) toWrite.column2 -= toWrite.column3;

    // if (toWrite.column1 === 0) toWrite.column1 = 'ЛР';
    clearInterval(fakeTimer);

    if (currentIndex === maxTableSize) currentIndex = 0;

    if (toWrite.column4 === 'Пром. такт') {
        // if (isNaN(toWrite.column4)) {
        if ($expandedTable.bootstrapTable('getData').length < maxTableSize) {
            $expandedTable.bootstrapTable('append', toWrite);
        } else {
            $expandedTable.bootstrapTable('updateRow', {index: currentIndex, row: Object.assign({}, toWrite)});
        }
        if (dataArr[prevIndex] !== undefined) {
            $expandedTable.bootstrapTable('updateCell', {
                index: prevIndex,
                field: 'column5',
                value: data.ttcdk
            });
            $expandedTable.bootstrapTable('updateCell', {
                index: prevIndex,
                field: 'column6',
                value: data.ttcdk + dataArr[prevIndex].column3
            });
            $expandedTable.bootstrapTable('updateCell', {
                index: prevIndex,
                field: 'column7',
                value: (dataArr[prevIndex].column1 === 'ЛР') ? 0 : (dataArr[prevIndex].column6 + dataArr[prevIndex].column2) - toWrite.column2
            });

            toWrite.column7 = dataArr[prevIndex].column2;
        }
        colorizeRow(currentIndex);
        fakeTimer = setInterval(() => {
            toWrite.column3++;
            toWrite.column6++;
            toWrite.column7++;
            $expandedTable.bootstrapTable('updateRow', {index: currentIndex, row: Object.assign({}, toWrite)});
            colorizeRow(currentIndex);
            // console.log('updateRow ' + currentIndex + ' ', toWrite);
        }, 1000);
    } else if ($expandedTable.bootstrapTable('getData').length !== 0) {
        toWrite.column3 = data.ttcdk;

        if (isNaN(toWrite.column4)) {
            if ($expandedTable.bootstrapTable('getData').length < maxTableSize) {
                $expandedTable.bootstrapTable('append', toWrite);
            } else {
                $expandedTable.bootstrapTable('updateRow', {index: currentIndex, row: Object.assign({}, toWrite)});
            }
        } else {
            if ((dataArr[currentIndex] !== undefined) && (dataArr[currentIndex].column4 === 'Пром. такт')) {
                $expandedTable.bootstrapTable('updateRow', {index: currentIndex, row: Object.assign({}, toWrite)});
            } else {
                if ($expandedTable.bootstrapTable('getData').length < maxTableSize) {
                    $expandedTable.bootstrapTable('append', toWrite);
                } else {
                    if (data.fdk === data.ftudk) toWrite.column1 = data.ftudk
                    $expandedTable.bootstrapTable('updateRow', {index: currentIndex, row: Object.assign({}, toWrite)});
                }
                $expandedTable.bootstrapTable('updateCell', {
                    index: prevIndex,
                    field: 'column7',
                    value: (dataArr[prevIndex].column6 + dataArr[prevIndex].column2) - toWrite.column2
                });
            }
        }

        colorizeRow(currentIndex);
        // toWrite.column5++;
        toWrite.column6 = toWrite.column3 + toWrite.column5;
        toWrite.column7 = toWrite.column2 + toWrite.column3 + toWrite.column5;
        $expandedTable.bootstrapTable('updateRow', {index: currentIndex, row: Object.assign({}, toWrite)});
        colorizeRow(currentIndex);
        fakeTimer = setInterval(() => {
            toWrite.column5++;
            toWrite.column6++;
            toWrite.column7++;
            $expandedTable.bootstrapTable('updateRow', {index: currentIndex - 1, row: Object.assign({}, toWrite)});
            colorizeRow(currentIndex - 1);
            // console.log('updateRow ' + (currentIndex - 1) + ' ', toWrite);
        }, 1000);
        if (currentIndex < $expandedTable.bootstrapTable('getData').length) prevIndex = currentIndex;
        currentIndex++;
    }

    if (typeof setPhase !== "undefined") {
        setPhase(data.fdk);
    }

    $('#phase')[0].innerText = 'Фаза: ' + toWrite.column4;
}

function checkConnection(connectionFlag, phase) {
    // console.log('checkConnection', connectionFlag);
    connectionFlag = (connectionFlag === undefined) ? control : connectionFlag;

    $('#pk').hide();
    $('#sk').hide();
    $('#nk').hide();
    $('#phase').hide();
    // $('#transition').hide();
    $('#expandedTable').hide();
    $('#verificationRow').hide();

    if (connectionFlag) {
        $('a').each(function () {
            this.className = checkButton(this.className.toString(), editFlag);
        });
        $('select').each(function () {
            checkSelect($(this), editFlag);
        });
        $('#pk').show();
        $('#sk').show();
        $('#nk').show();
        $('#phase').show();
        $('#expandedTable').show();
        // setPhase(0);
        $('#verificationRow').show();


        if (typeof setPhase !== "undefined") {
            if (typeof setVisualMode !== "undefined") setVisualMode(0);
            setPhase(phase ?? 0);
        }
    } else {
        $('a').each(function () {
            this.className = checkButton(this.className.toString(), false);
        });
        $('select').each(function () {
            checkSelect($(this), false);
        });
    }
    control = connectionFlag;
}

//Остановка отправки фаз на контроллер
function stopSendingCommands(id) {
    $('a[style^=" background-color: #cccccc;"]').each(function () {
        if (id !== $(this)[0].id) $(this).trigger('click');
    });
}

function buttonClick(button, id) {
    let toSend = {id: id, cmd: 9, param: 0};
    switch (button) {
        case 'lr':
            toSend.param = 0;
            break;
        case 'p1':
            toSend.param = 1;
            break;
        case 'p2':
            toSend.param = 2;
            break;
        case 'p3':
            toSend.param = 3;
            break;
        case 'p4':
            toSend.param = 4;
            break;
        case 'p5':
            toSend.param = 5;
            break;
        case 'p6':
            toSend.param = 6;
            break;
        case 'p7':
            toSend.param = 7;
            break;
        case 'p8':
            toSend.param = 8;
            break;
        case 'ky':
            toSend.param = 9;
            break;
        case 'jm':
            toSend.param = 10;
            break;
        case 'os':
            toSend.param = 11;
            break;
    }
    controlSend(toSend);
}

function selectChange(select, id) {
    let toSend = {id: id, cmd: 0, param: 0};
    switch (select) {
        case '#pk':
            toSend.cmd = 5;
            break;
        case '#sk':
            toSend.cmd = 6;
            break;
        case '#nk':
            toSend.cmd = 7;
            break;
    }
    toSend.param = Number($(select).val());
    controlSend(toSend);
}

//переход на автоматическое регулирование по 0
function getDescription(toSend) {
    switch (toSend.cmd) {
        case 4:
            if (toSend.param === 1) {
                return 'Отправлен запрос на смену фаз';
            } else {
                return 'Отключить запрос на смену фаз';
            }
        case 5:
            if (toSend.param === 0) return 'Отправлена команда "Переход на автоматическое регулирование ПК"';
            return 'Отправлена команда "Сменить ПК на №' + toSend.param + '"';
        case 6:
            if (toSend.param === 0) return 'Отправлена команда "Переход на автоматическое регулирование СК"';
            return 'Отправлена команда "Сменить CК на №' + toSend.param + '"';
        case 7:
            if (toSend.param === 0) return 'Отправлена команда "Переход на автоматическое регулирование НК"';
            return 'Отправлена команда "Сменить НК на №' + toSend.param + '"';
    }
    switch (toSend.param) {
        case 0:
            return 'Отправлена команда "Локальный режим"';
        case 9:
            return 'Отправлена команда "Координированное управление"';
        case 10:
            return 'Отправлена команда "Включить жёлтое мигание"';
        case 11:
            return 'Отправлена команда "Отключить светофоры"';
    }
    return 'Отправлена команда "Включить фазу №"' + toSend.param;
}

//Отправка выбранной команды на сервер
function controlSend(toSend) {
    ws.send(JSON.stringify({type: 'dispatch', id: toSend.id, cmd: toSend.cmd, param: toSend.param}));
}

function checkButton(buttonClass, rights) {
    if (rights) {
        if (buttonClass.indexOf('disabled') !== -1) return buttonClass.substring(0, buttonClass.length - 9);
    } else {
        if (buttonClass.indexOf('disabled') === -1) return buttonClass.concat(' disabled');
    }
    return buttonClass;
}

function checkSelect($select, rights) {
    if (rights) {
        $select.prop('disabled', false);
    } else {
        $select.prop('disabled', true);
    }
}

function checkEdit() {
    // console.log('checkedit', editFlag);
    // if (editFlag) {
    $('a').each(function () {
        this.className = checkButton($(this)[0].className.toString(), editFlag);
    });
    // $('#controlButton')[0].className = checkButton($('#controlButton')[0].className.toString(), editFlag);
    // } else {
    //     $('a').each(function () {
    //         $(this).hide();
    //     });
    //     $('#controlButton').hide();
    // }
    $('select').each(function () {
        checkSelect($(this), editFlag);
    });
}

function colorizeRow(index) {
    $('#expandedTable').find('tbody').find('tr').each(function (counter) {
        if (counter === index) {
            $(this).find('td').each(function () {
                $(this).attr('style', 'background-color: #cccccc')
            })
        }
    });
}

// /video?channelid=<id canala>&login={imya usera}&password={psw}