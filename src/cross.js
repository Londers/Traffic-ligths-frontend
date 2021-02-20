//todo если есть подрайон (!=0), по изменению карт предлагать поменять во всём подрайоне

'use strict';

let ID = 0;
let loopFunc;
let phaseFlags = [];
let editFlag = false;
let control;
let idevice = undefined;
let ws;

$(function () {
    ws = new WebSocket('wss://' + location.host + location.pathname + 'W' + location.search);
    ws.onopen = function () {
        console.log('connected');
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
    };

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
            case 'crossBuild':
                let state = data.state;
                let cross = data.cross;
                let controlCrossFlag = data.access[4];
                let region = data.cross.region.num;
                let area = data.cross.area.num;
                ID = data.cross.ID;
                idevice = data.state.idevice;
                editFlag = data.edit;
                document.title = 'ДК-' + ID;

                $('#connection')[0].innerText = data.scon ? data.eth ? 'LAN' : 'GPRS' : '';

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

                console.log(data);

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
                        console.log(svgData);
                        // $('div[class="col-sm-3 text-left mt-3"]').prepend(svgData.children[0].outerHTML);
                        $('#img-col').prepend(svgData.children[0].outerHTML);
                        $('svg').each(function (index) {
                            $(this).attr('id', 'svg' + index);
                        });
                        $('#svg0').attr('width', $('#img-col')[0].offsetWidth);

                        $(window).resize(() => {
                            $('#svg0').attr('width', $('#img-col')[0].offsetWidth);
                        });
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
                        if (typeof getPhasesMass === "function") {
                            let phases = getPhasesMass();
                            phases.sort((a, b) => {
                                return Number(b.num) - Number(a.num);
                            });
                            phases.forEach(phase => {
                                $('#buttons')
                                    .prepend('<a class="btn btn-light border disabled" id="p' + phase.num + '" data-toggle="tooltip" title="Включить ' + phase.num + ' фазу" role="button"\n' +
                                        '><svg id="example1" width="100%" height="100%" style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                                        '<image x="0" y="0" width="100%" height="100%" style="max-height: 50px; max-width: 50px; min-height: 30px; min-width: 30px;"  xlink:href="data:image/png;base64,' + phase.phase + '"/>' +
                                        '</svg></a>');
                                // $('#p' + phase.num).on('click', function () {
                                // setPhase(phase.num);
                                //TODO make change request
                                // })
                            });
                            // phases.forEach((svgPhase, index) => {
                            //     if (!data.phases.includes(Number(svgPhase.num))) console.log('I DID IT', phases[index])
                            // })

                            //Проверка соотсветсвия фаз
                            // data.phases.forEach((phase, index) => {
                            //     if (!phases.some(svgPhase => Number(svgPhase.num) === phase)) {
                            //         $('#buttons')
                            //             .prepend('<a class="btn btn-light border disabled" style="background-color: red" id="p' + data.phases[index] + '" data-toggle="tooltip" title="Включить ' + data.phases[index] + ' фазу" role="button">' +
                            //                 '<div class="container-fluid" style="width: 50px; height: 50px;"><strong><big><big><big >' + data.phases[index] + '</big></big></big></big></strong></div>' +
                            //                 '</a>');
                            //     }
                            // })
                        } else {
                            for (let i = 8; i > 0; i--) {
                                $('#buttons')
                                    .prepend('<a class="btn btn-light border mt-2 disabled" id="p' + i + '" data-toggle="tooltip" title="' + i + '"'
                                        + ' role="button"><img class="img-fluid" src="/file/static/img/buttons/' + i + '.svg" height="50"'
                                        + '  alt="Фаза "' + i + '></a>');
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
                        checkConnection(cross.tlsost.control);
                        buildExpandedTable(data.dk);
                    },
                    error: function (request) {
                        console.log(request.status + ' ' + request.responseText);
                    }
                });

                /*
                <a class="btn btn-light border disabled" id="p1" data-toggle="tooltip" title="Включить 1 фазу" role="button"
               style="display: none;"><img class="img-fluid" src="/file/img/buttons/p1.svg" height="50" alt="1 фаза"></a>
                */
                //---------------------------------------------------------------------------------------------------------------------------------------------------
                $('#status').html('Статус: ' + data.cross.tlsost.description);

                $('#openDeviceLog').on('click', () => {
                    localStorage.setItem('ID', cross.ID);
                    localStorage.setItem('area', cross.area.num);
                    localStorage.setItem('region', cross.region.num);
                    localStorage.setItem('description', cross.description);
                    window.open(window.location.origin + '/user/' + localStorage.getItem('login') + '/deviceLog', idevice);
                });

                $('#controlButton').on('click', function () {
                    window.open(window.location.origin + window.location.pathname + '/control' + window.location.search, idevice);
                });

                //Проверка существования карт и добавление их выбора
                counter = 0;
                data.state.arrays.SetDK.dk.forEach(tab => {
                    // if (tab.sts[0].stop !== 0) {
                    $('#pk').append(new Option('ПК ' + (counter + 1), counter + 1));
                    // }
                    counter++;
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
            case 'changeEdit':
                console.log('edit:' + data.edit);
                editFlag = data.edit;
                // if (editFlag) controlSend({id: idevice, cmd: 4, param: 1});
                checkEdit();
                checkConnection();
                break;
            case 'dispatch':
                console.log('dispatch', data);
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
            case 'crossUpdate':
                console.log('crossUpdate', data);
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

                checkConnection(data.status.control);
                break;
            case 'stateChange':
                $('#description').html(data.state.name);

                // $('#pk').find('option').remove();
                $('#sk').find('option').remove();
                $('#nk').find('option').remove();

                // data.state.arrays.SetDK.dk.forEach((rec, counter) => {
                //     $('#pk').append(new Option('ПК ' + (counter + 1), counter + 1));
                // });
                $('#pk').find('option').each(function () {
                    $(this).removeAttr('selected');
                });
                $('#pk option[value=' + data.state.pk + ']').attr('selected', 'selected');

                $('#sk').append(new Option('0', '0'));
                data.state.arrays.DaySets.daysets.forEach((rec, counter) => {
                    if (rec.lines[0].npk !== 0) {
                        $('#sk').append(new Option('CК ' + (counter + 1), counter + 1));
                    }
                });
                $('#sk option[value=' + data.state.ck + ']').attr('selected', 'selected');

                $('#nk').append(new Option('0', '0'));
                data.state.arrays.WeekSets.wsets.forEach((rec, counter) => {
                    let flag = true;
                    rec.days.forEach(day => {
                        if (rec.days[day] === 0) flag = false;
                    });
                    if (flag) $('#nk').append(new Option('НК ' + (counter + 1), counter + 1));
                });

                console.log('stateChange', data);
                $('#pk').find('option').each(function () {
                    $(this).removeAttr('selected');
                });
                $('#sk').find('option').each(function () {
                    $(this).removeAttr('selected');
                });
                $('#nk').find('option').each(function () {
                    $(this).removeAttr('selected');
                });
                break;
            case 'crossConnection':
                $('#connection')[0].innerText = data.scon ? data.eth ? 'LAN' : 'GPRS' : '';
                break;
            case 'phase':
                console.log('phase ', data);
                //Обработка таблицы
                buildExpandedTable(data.dk);
                if (data.dk.edk === 1) {
                    $('#transition').show();
                    // $('#status').hide();
                } else {
                    $('#transition').hide();
                    // $('#status').show();
                }
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
                console.log('error', evt);
                break;
            default:
                console.log('unknown command');
                break;
        }
    };

    ws.onerror = function (evt) {
        console.log('WebSocket error:' + evt);
    };

    $('#verification').bootstrapTable('removeAll');
});

let fakeTimer;

// let fakeTimer2;
// function buildTable(data) {
//     // buildExpandedTable(data);
//
//     let $table = $('#table');
//     if ($table.bootstrapTable('getData').length > 20) {
//         $table.bootstrapTable('removeAll');
//     }
//     let dataArr = $table.bootstrapTable('getData').slice();
//     let lastRow = dataArr[dataArr.length - 1];
//     if (lastRow === undefined) lastRow = {phaseNum: -1};
//     let toWrite = {phaseNum: data.fdk, tPr: '', tMain: '', duration: ''};
//     let newFlag;
//
//     if (typeof setPhase !== "undefined") {
//         setPhase(toWrite.phaseNum);
//     }
//
//     clearInterval(fakeTimer);
//
//     if (toWrite.phaseNum === 9) {
//         if (lastRow.phaseNum === toWrite.phaseNum) {
//             toWrite.tPr = lastRow.tPr + data.tdk;
//             newFlag = false;
//         } else {
//             lastRow.tMain -= data.tdk;
//             lastRow.duration -= data.tdk;
//             toWrite.tPr = data.tdk;
//             newFlag = true;
//         }
//         toWrite.phaseNum = 'Пром. такт'
//     } else {
//         if (lastRow.phaseNum === toWrite.phaseNum) {
//             toWrite.tMain += lastRow.tMain + data.tdk;
//             newFlag = false;
//         } else if (lastRow.phaseNum === 'Пром. такт') {
//             toWrite.tMain = data.tdk;
//             toWrite.tPr = lastRow.tPr;
//             newFlag = false;
//         } else {
//             toWrite.tMain = data.tdk;
//             newFlag = true;
//         }
//
//     }
//     toWrite.duration = Number(toWrite.tPr) + Number(toWrite.tMain);
//
//     if (newFlag) {
//         $table.bootstrapTable('append', toWrite);
//     } else {
//         $table.bootstrapTable('updateRow', {index: dataArr.length - 1, row: toWrite});
//     }
//
//     if (toWrite.phaseNum === 'Пром. такт') {
//         fakeTimer = setInterval(() => {
//             toWrite.tPr++;
//             toWrite.duration++;
//             $table.bootstrapTable('updateRow', {index: dataArr.length, row: toWrite});
//         }, 1000);
//     } else {
//         fakeTimer = setInterval(() => {
//             toWrite.tMain++;
//             toWrite.duration++;
//             $table.bootstrapTable('updateRow', {index: dataArr.length - 1, row: toWrite});
//         }, 1000);
//     }
//
// }
// let tableData;

// let prevIndex = -1;
// const maxTableSize = 5;
// function buildExpandedTable(data) {
//     let $expandedTable = $('#expandedTable');
//     let dataArr = $expandedTable.bootstrapTable('getData').slice();
//     // if (dataArr.length > 20) {
//     //     $expandedTable.bootstrapTable('removeAll');
//     // }
//     let prevRow = dataArr[prevIndex - 1];
//     console.log('prevRow', prevIndex - 1);
//     // let prevRow = dataArr[(dataArr.length === 16) ? (prevIndex) : prevIndex - 1];
//     if (prevRow === undefined) prevRow = {ftudk: -1};
//     let toWrite = {
//         column1: data.ftudk,
//         column2: data.tdk,
//         column3: 0,
//         column4: data.fdk,
//         column5: 0,
//         column6: 0,
//         column7: 0
//     };
//
//     toWrite.column2 = prevRow.column2;
//     switch (toWrite.column4) {
//         case 9:
//             toWrite.column4 = 'Пром. такт';
//             toWrite.column2 = data.tdk;
//             break;
//         case 10:
//         case 14:
//             toWrite.column1 = 'ЖМ';
//             toWrite.column4 = 'ЖМ';
//             break;
//         case 11:
//         case 15:
//             toWrite.column1 = 'ОС';
//             toWrite.column4 = 'ОС';
//             break;
//         case 12:
//             toWrite.column1 = 'КК';
//             toWrite.column4 = 'КК';
//             break;
//         default:
//             toWrite.column3 = data.tdk - prevRow.column3;
//             break;
//     }
//
//     if (toWrite.column1 === 0) toWrite.column1 = 'ЛР';
//
//     // if (toWrite.column4 === 9) {
//     //     toWrite.column2 = data.tdk;
//     //     toWrite.column4 = 'Пром. такт';
//     // } else {
//     //     toWrite.column2 = lastRow.column2;
//     //     toWrite.column3 = data.tdk - lastRow.column3;
//     // }
//
//
//     clearInterval(fakeTimer);
//
//     // switch (lastIndex) {
//     //     case 0:
//     //         $expandedTable.bootstrapTable('append', toWrite);
//     //         $expandedTable.bootstrapTable('hideRow', {index: 0});
//     //         // lastIndex++;
//     //         break;
//     //     case 14:
//     //         // lastIndex = 1;
//     //         $expandedTable.bootstrapTable('updateRow', {index: lastIndex, row: Object.assign({}, toWrite)});
//     //         break;
//     //     default:
//     //         if (toWrite.column4 === 'Пром. такт') {
//     //             if (dataArr.length < 14) {
//     //                 $expandedTable.bootstrapTable('append', toWrite);
//     //             } else {
//     //                 $expandedTable.bootstrapTable('updateRow', {index: lastIndex, row: Object.assign({}, toWrite)});
//     //             }
//     //         } else {
//     //             toWrite.column3 = lastRow.column3;
//     //             $expandedTable.bootstrapTable('updateRow', {index: lastIndex-1, row: Object.assign({}, toWrite)});
//     //         }
//     //         lastIndex++;
//     //         break;
//     // }
//
//     switch (prevIndex) {
//         case -1:
//             // if (dataArr.length < maxTableSize) {/
//             // $expandedTable.bootstrapTable('append', toWrite);
//             // console.log('append ', toWrite);
//             // $expandedTable.bootstrapTable('hideRow', {index: 0});
//             if (toWrite.column4 !== 'Пром. такт') prevIndex += 1;
//             return;
//         // } else {
//         // prevIndex =
//         // }
//         // break;
//         case maxTableSize:
//             // $expandedTable.bootstrapTable('removeAll');
//             // $expandedTable.bootstrapTable('append', toWrite);
//             if (toWrite.column4 === 'Пром. такт') prevIndex = 0;
//             // $expandedTable.bootstrapTable('updateRow', {index: prevIndex, row: Object.assign({}, toWrite)});
//             // console.log('updateRow ' + prevIndex + ' ', toWrite);
//             break;
//         default:
//             if (toWrite.column4 === 'Пром. такт') {
//                 if (dataArr.length < maxTableSize - 1) {
//                     $expandedTable.bootstrapTable('append', toWrite);
//                     // console.log('append ', toWrite);
//                     prevIndex++;
//                 } else {
//                     // $expandedTable.bootstrapTable('updateRow', {index: prevIndex, row: Object.assign({}, toWrite)});
//                     // console.log('updateRow ' + prevIndex + ' ', toWrite);
//                 }
//             } else {
//                 toWrite.column3 = prevRow.column3;
//                 // $expandedTable.bootstrapTable('updateRow', {index: prevIndex - 1, row: Object.assign({}, toWrite)});
//                 // console.log('updateRow ' + (prevIndex - 1) + ' ', toWrite);
//             }
//             break;
//     }
//
//     let index;
//
//     if (dataArr.length === (maxTableSize - 1)) {
//         if (prevIndex === 0) {
//             index = maxTableSize - 2;
//         } else {
//             index = prevIndex - 1;
//         }
//     } else {
//         // if (prevIndex === 1) {
//         //     index = 0;
//         // } else {
//             index = prevIndex - 1;
//         // }
//     }
//
//     prevRow = dataArr[index - 1];
//     if (prevRow === undefined) prevRow = {ftudk: -1};
//
//     if (toWrite.column4 === 'Пром. такт') {
//         toWrite.column7 = toWrite.column2;
//
//         if (index !== 0) {
//             console.log('updateCell', {
//                 index: index - 1,
//                 field: 'column7',
//                 prev7: prevRow.column7,
//                 towrite2: toWrite.column2,
//                 prevIndex: prevIndex
//             });
//
//             $expandedTable.bootstrapTable('updateCell', {
//                 index: index - 1,
//                 field: 'column7',
//                 value: prevRow.column7 - toWrite.column2
//             });
//         } else if (dataArr.length === (maxTableSize - 1)) {
//             console.log('updateCell', {
//                 index: index - 1,
//                 field: 'column7',
//                 prev7: prevRow.column7,
//                 towrite2: toWrite.column2,
//                 prevIndex: prevIndex
//             });
//
//             $expandedTable.bootstrapTable('updateCell', {
//                 index: index - 1,
//                 field: 'column7',
//                 value: prevRow.column7 - toWrite.column2
//             });
//         }
//
//         fakeTimer = setInterval(() => {
//             toWrite.column3++;
//             toWrite.column6++;
//             toWrite.column7++;
//             $expandedTable.bootstrapTable('updateRow', {index: prevIndex, row: Object.assign({}, toWrite)});
//             // console.log('updateRow ' + index + ' ', toWrite);
//         }, 1000);
//     } else {
//         // toWrite.column5 += 1;
//         toWrite.column6 = toWrite.column3 + toWrite.column5;
//         toWrite.column7 = toWrite.column2 + toWrite.column3 + toWrite.column5;
//         fakeTimer = setInterval(() => {
//             toWrite.column5++;
//             toWrite.column6++;
//             toWrite.column7++;
//             $expandedTable.bootstrapTable('updateRow', {index: index, row: Object.assign({}, toWrite)});
//             console.log('updateRow ' + index + ' ', toWrite);
//         }, 1000);
//     }
//
//
//     if (typeof setPhase !== "undefined") {
//         setPhase(data.fdk);
//     }
//
//     $('#phase')[0].innerText = 'Фаза: ' + toWrite.column4;
//     if ((dataArr.length === (maxTableSize - 1)) && (toWrite.column4 !== 'Пром. такт')) prevIndex++;
// }


const maxTableSize = 12;
let currentIndex = 0;
let prevIndex = 0;

function buildExpandedTable(data) {
    let $expandedTable = $('#expandedTable');
    let dataArr = $expandedTable.bootstrapTable('getData').slice();

    let toWrite = {
        column1: data.ftudk,
        column2: data.tdk,
        column3: 0,
        column4: data.fdk,
        column5: 0,
        column6: 0,
        column7: 0
    };

    if ($expandedTable.bootstrapTable('getData').length !== 0) toWrite.column2 = dataArr[prevIndex].column2;
    switch (toWrite.column4) {
        case 9:
            toWrite.column4 = 'Пром. такт';
            toWrite.column2 = data.tdk;
            break;
        case 10:
        case 14:
            toWrite.column1 = 'ЖМ';
            toWrite.column4 = 'ЖМ';
            break;
        case 11:
        case 15:
            toWrite.column1 = 'ОС';
            toWrite.column4 = 'ОС';
            break;
        case 12:
            toWrite.column1 = 'КК';
            toWrite.column4 = 'КК';
            break;
        default:
            // if ($expandedTable.bootstrapTable('getData').length !== 0) toWrite.column2 = data.tdk - dataArr[prevIndex].column3;
            break;
    }

    // if (($expandedTable.bootstrapTable('getData').length !== 0) && (toWrite.column4 !== 'Пром. такт')) toWrite.column2 -= toWrite.column3;

    if (toWrite.column1 === 0) toWrite.column1 = 'ЛР';
    clearInterval(fakeTimer);

    if (currentIndex === maxTableSize) currentIndex = 0;

    if (toWrite.column4 === 'Пром. такт') {
        if ($expandedTable.bootstrapTable('getData').length !== maxTableSize) {
            $expandedTable.bootstrapTable('append', toWrite);
        } else {
            $expandedTable.bootstrapTable('updateRow', {index: currentIndex, row: Object.assign({}, toWrite)});
        }
        if (dataArr[prevIndex] !== undefined) {
            $expandedTable.bootstrapTable('updateCell', {
                index: prevIndex,
                field: 'column7',
                value: dataArr[prevIndex].column7 - toWrite.column2
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
            console.log('updateRow ' + currentIndex + ' ', toWrite);
        }, 1000);
    } else if ($expandedTable.bootstrapTable('getData').length !== 0) {
        toWrite.column3 = data.tdk - dataArr[prevIndex].column2;

        $expandedTable.bootstrapTable('updateRow', {index: currentIndex, row: Object.assign({}, toWrite)});
        colorizeRow(currentIndex);
        toWrite.column5++;
        toWrite.column6 = toWrite.column3 + toWrite.column5;
        toWrite.column7 = toWrite.column2 + toWrite.column3 + toWrite.column5;
        fakeTimer = setInterval(() => {
            toWrite.column5++;
            toWrite.column6++;
            toWrite.column7++;
            $expandedTable.bootstrapTable('updateRow', {index: currentIndex - 1, row: Object.assign({}, toWrite)});
            colorizeRow(currentIndex - 1);
            console.log('updateRow ' + (currentIndex - 1) + ' ', toWrite);
        }, 1000);
        prevIndex = currentIndex;
        currentIndex++;
    }


    if (typeof setPhase !== "undefined") {
        setPhase(data.fdk);
    }

    $('#phase')[0].innerText = 'Фаза: ' + toWrite.column4;

}

function checkConnection(connectionFlag) {
    // console.log('checkConnection', connectionFlag);
    connectionFlag = (connectionFlag === undefined) ? control : connectionFlag;

    $('#pk').hide();
    $('#sk').hide();
    $('#nk').hide();
    $('#phase').hide();
    $('#transition').hide();
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
            setPhase(0);
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


//Функция для обновления данных на странице
// function reload() {
//     if (!document.hidden) {
//         $.ajax({
//             type: 'POST',
//             url: window.location.href,
//             success: function (data) {
//                 let statusChanged = false;
//                 $('#description').html(data.cross.description);
//                 if ($('#status')[0].innerText.substring(8) !== data.cross.tlsost.description) statusChanged = true;
//                 $('#status').html('Статус: ' + data.cross.tlsost.description);
//                 $('#pk').find('option').each(function () {
//                     $(this).removeAttr('selected');
//                 });
//                 $('#sk').find('option').each(function () {
//                     $(this).removeAttr('selected');
//                 });
//                 $('#nk').find('option').each(function () {
//                     $(this).removeAttr('selected');
//                 });
//
//                 $('#pk option[value=' + data.state.pk + ']').attr('selected', 'selected');
//                 $('#sk option[value=' + data.state.ck + ']').attr('selected', 'selected');
//                 $('#nk option[value=' + data.state.nk + ']').attr('selected', 'selected');
//
//                 deviceRequest(data.state.idevice, statusChanged);
//
//                 $('svg[width*="mm"]').each(function () {
//                     $(this).attr('width', "450");
//                 });
//                 $('svg[height*="mm"]').each(function () {
//                     $(this).attr('height', "450");
//                 });
//
//                 if (noConnectionStatusArray.includes(data.cross.tlsost.num)) {
//                     $('a').each(function () {
//                         this.className = checkButton(this.className.toString(), false);
//                     });
//                     $('select').each(function () {
//                         checkSelect($(this), false);
//                     });
//                     $('#table').hide();
//                     $('#verificationRow').hide();
//                 } else {
//                     $('a').each(function () {
//                         this.className = checkButton(this.className.toString(), true);
//                     });
//                     $('select').each(function () {
//                         checkSelect($(this), true);
//                     });
//                     $('#table').show();
//                     $('#verificationRow').show();
//                 }
//             },
//             error: function (request) {
//                 console.log(request.status + ' ' + request.responseText);
//                 if (!status) {
//                     alert(request.status + ' ' + request.responseText);
//                     window.location.href = window.location.origin;
//                 }
//             }
//         });
//     }
// }

// function deviceRequest(idevice, statusChanged) {
//     if (!statusChanged) {
//         if (deviceFlag) return;
//     }
//     // if (deviceFlag && statusChanged) return;
//     $.ajax({
//         type: 'POST',
//         url: window.location.origin + window.location.pathname + '/dev?idevice=' + idevice,
//         success: function (data, text, xhr) {
//             deviceFlag = false;
//             if (xhr.status !== 200) {
//                 deviceFlag = true;
//                 return;
//             }
//             if (data.device === undefined) return;
//             if (data.device.DK.fdk === 0) return;
//
//             //Обработка таблицы
//             let $table = $('#table');
//             let dataArr = $table.bootstrapTable('getData');
//             let toWrite = {phaseNum: data.device.DK.fdk, tPr: '', tMain: '', duration: ''};
//             let checkDup = false;
//             let index = 0;
//             $('#phase')[0].innerText = 'Фаза: ' + toWrite.phaseNum;
//             if (typeof setPhase !== "undefined") {
//                 setPhase(toWrite.phaseNum);
//             }
//             (data.device.DK.pdk) ? toWrite.tPr = data.device.DK.tdk : toWrite.tMain = data.device.DK.tdk;
//             dataArr.forEach(rec => {
//                 (rec.phaseNum === data.device.DK.fdk) ? checkDup = true : index++;
//             });
//             if (!checkDup) {
//                 toWrite.duration = toWrite.tMain + toWrite.tPr;
//                 dataArr.push(toWrite);
//                 dataArr.sort(compare);
//             } else {
//                 toWrite.phaseNum = dataArr[index].phaseNum;
//                 (data.device.DK.pdk) ? toWrite.tMain = dataArr[index].tMain : toWrite.tPr = dataArr[index].tPr;
//                 toWrite.duration = toWrite.tMain + toWrite.tPr;
//                 $table.bootstrapTable('updateRow', {index: index, row: toWrite});
//             }
//         },
//         error: function (request) {
//             console.log(request.status + ' ' + request.responseText);
//             if (!status) {
//                 // alert(request.status + ' ' + request.responseText);
//                 // window.location.href = window.location.origin;
//             }
//         }
//     });
// }

// function compare(a, b) {
//     if (a.phaseNum > b.phaseNum) return 1;
//     if (b.phaseNum > a.phaseNum) return -1;
//     return 0;
// }

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