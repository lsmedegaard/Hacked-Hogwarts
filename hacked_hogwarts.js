"use strict";

//Henter jsondata 
async function getData() {
    const link = "https://petlatkea.dk/2021/hogwarts/students.json"
    const response = await fetch(link)
    const jdata = await response.json()
    return jdata
}


function capitalize(name) {
    const parts = name.split('-')
    let cleanName = ''
    parts.forEach((part, index) => {
        const up = part.substring(0, 1).toUpperCase()
        const down = part.substring(1).toLowerCase()
        if (index > 0) cleanName += '-'
        cleanName += up + down
    })
    return cleanName
}


function cleanData(jdata) {
    const clean = []
    jdata.forEach(student => {
        let fullname = student.fullname.trim()
        const parts = fullname.split(" ")
        const firstname = capitalize(parts[0])
        let middlename = null
        let lastname = null
        let nickname = null


        if (parts.length === 3 && parts[1].includes(`"`)) {
            nickname = capitalize(parts[1].substring(1, parts[1].lastIndexOf('"')))
            lastname = capitalize(parts[2])
        } else if (parts.length === 2 && parts[1].includes(`"`)) {
            nickname = capitalize(parts[1].substring(1, parts[1].lastIndexOf('"')))
        } else if (parts.length === 3) {
            middlename = capitalize(parts[1])
            lastname = capitalize(parts[2])
        } else if (parts.length == 2) {
            lastname = capitalize(parts[1])
        }

        if (middlename === null) {
            fullname = capitalize(`${firstname}`) + " " + capitalize(`${lastname}`);
        } else {
            fullname = capitalize(`${firstname}`) + " " + capitalize(`${middlename}`) + " " + capitalize(`${lastname}`);
        }
        if (lastname === null) {
            fullname = capitalize(`${firstname}`)
        }
        let gender = capitalize(student.gender.trim());
        let house = capitalize(student.house.trim());
        // fullname = capitalize(`${firstname}`) + " " + capitalize(`${middlename}`) + " " + capitalize(`${lastname}`);


        const studentObject = {
            fullname,
            firstname,
            middlename,
            nickname,
            lastname,
            gender,
            house
        }
        clean.push(studentObject)
    })
    show(clean)

    return clean
}
const container = document.querySelector("#container");
const template = document.querySelector("template");

function show (student) {
    student.forEach(student => {
        let clone = template.cloneNode(true).content;
        clone.querySelector("#students").textContent = student.fullname
        container.appendChild(clone)
    });
}


async function main () {
    const data = await getData()
    const clean = cleanData(data)
    console.log('clean', clean)
}

main()


