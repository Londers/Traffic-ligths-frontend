'use strict';

let dataSave;
let regionInfo;
let areaInfo;

$(document).ready(function () {
	let $table = $('#table');
	load($table, true);
	$('#updateButton').on('click', function() {
	    load($table, false);
	});
	$('#kickButton').on('click', function() {
        kick($table);
    });

})

function load($table, firstLoadFlag) {
	$.ajax({
		type: 'POST',
		url: window.location.href,
		success: function (data) {
		    dataSave = data;
		    console.log(data);
		    if(firstLoadFlag) regionInfo = data.regionInfo;
		    if(firstLoadFlag) areaInfo = data.areaInfo;
            let dataArray = [];
            let tempRecord;
            for (let user in data.CrossEditInfo) {
                tempRecord = {login : '', engagedARM : ''}
                tempRecord.login = user.toString();
                let counter = 0;
                data.CrossEditInfo[user].forEach(dk => {
                    tempRecord.engagedARM = buildEngArm(data.CrossEditInfo[user.toString()][counter++]);
                    dataArray.push(Object.assign({}, tempRecord));
                })
            }

            $table.bootstrapTable('removeAll');
            $table.bootstrapTable('append', dataArray);
            $table.bootstrapTable('scrollTo', 'top');
            $table.bootstrapTable('refresh', {
                data: dataArray
            });

            $('#table tbody tr').each(function() {
                let dayCounter = 0;
                $(this).find('td').each(function() {
                    if(dayCounter++ === 2) {
                        $(this).attr('style', 'white-space:normal;');
                    }
                })
            });
		},
		error: function (request) {
			console.log(request.status + ' ' + request.responseText);
		}
	});
	if(firstLoadFlag) {
	    $('.fixed-table-toolbar').append('<button id="updateButton" class="btn btn-secondary mr-5">Обновить</button>' +
                                         ' <button id="kickButton" class="btn btn-secondary">Отключить</button>');
    }
}

function kick($table) {
    let selected = $table.bootstrapTable('getSelections');
    let toSend = {busyArms : []};
    let toSendArray = [];
    let tempRecord;

    selected.forEach(arm => {
        tempRecord = unbuildEngArm(arm.login, arm.engagedARM);
        toSendArray.push(Object.assign({}, tempRecord));
    })
    toSend.busyArms = toSendArray;

    $.ajax({
        url: window.location.href + '/free',
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            console.log(data.msg);
        },
        data: JSON.stringify(toSend),
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
        }
    });
}

function buildEngArm(data) {
    let value = ' Регион: ' + getRegionDesc(data.region) + '\n Область: ' + getAreaDesc(data.region, data.area) + '\n Описание: ' + data.description;
    return value;
}

function unbuildEngArm(login, description) {
    let data = description.split('\n');
    let tempRecord = {region : '', area : '', id : 0, description : ''};
    let counter = 0;

    for (let attr in tempRecord) {
        if(attr === 'id') {
            tempRecord[attr] = findID(login, data[2].substring(11));
        } else {
            tempRecord[attr] = data[counter].substring(counter++ + 9);
        }
    }
    tempRecord.area = getAreaNum(tempRecord.region, tempRecord.area);
    tempRecord.region = getRegionNum(tempRecord.region);
    return tempRecord;
}

function findID(login, description) {
    let counter = 0;
    let id = 0;
    dataSave.CrossEditInfo[login].forEach(rec => {
        if (rec.description === description) id = dataSave.CrossEditInfo[login][counter].ID;
        counter++;
    })
    return id;
}

function getRegionDesc(region) {
    return regionInfo[Number(region)];
}

function getRegionNum(region) {
    let num = 0;
    for (let reg in regionInfo) {
        if(regionInfo[reg] === region) num = reg;
    }
    return num;
}

function getAreaDesc(region, area) {
    return areaInfo[getRegionDesc(region)][Number(area)];
}

function getAreaNum(region, area) {
    let num = 0;
    for (let ar in areaInfo[region]) {
        if(areaInfo[region][ar] === area) num = ar;
    }
    return num.toString();
}

function sort(a, b) {
	var aName = a.login.toLowerCase();
	var bName = b.login.toLowerCase();
	return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}