"use strict";

//Henter jsondata 
async function getData() {
    const studentLink = "https://petlatkea.dk/2021/hogwarts/students.json"
    const studentResponse = await fetch(studentLink)
    const studentData = await studentResponse.json()
    const familyLink = 'https://petlatkea.dk/2021/hogwarts/families.json'
    const familyResponse = await fetch(familyLink)
    const familyData = await familyResponse.json()
    return { studentData, familyData }
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


function cleanData(studentData, familyMap) {
    const clean = []
    studentData.forEach(student => {
        let fullname = student.fullname.trim()
        const parts = fullname.split(" ")
        const firstname = capitalize(parts[0])
        let middlename = null
        let lastname = null
        let nickname = null


        if (parts.length === 3 && parts[1].includes(`"`)) {
            nickname = capitalize(parts[1].substring(1, parts[1].lastIndexOf('"')))
            lastname = capitalize(parts[2])
            fullname = `${firstname} "${nickname}" ${lastname}`
        } else if (parts.length === 2 && parts[1].includes(`"`)) {
            nickname = capitalize(parts[1].substring(1, parts[1].lastIndexOf('"')))
            fullname = `${firstname}`
        } else if (parts.length === 3) {
            middlename = capitalize(parts[1])
            lastname = capitalize(parts[2])
            fullname = `${firstname} "${middlename}" ${lastname}`
        } else if (parts.length == 2) {
            lastname = capitalize(parts[1])
            fullname = `${firstname} ${lastname}`
        } else {
            fullname = firstname
        }

        const gender = capitalize(student.gender.trim());
        const house = capitalize(student.house.trim());

        const bloodstatus = familyMap[lastname] || 'Unknown'

        const imagePath = lastname ? `${lastname.toLowerCase()}_${firstname[0].toLowerCase()}` : null

        const crestPath = student.house.trim();

        const studentObject = {
            fullname,
            firstname,
            middlename,
            nickname,
            lastname,
            gender,
            house,
            bloodstatus,
            imagePath,
            crestPath
        }
        clean.push(studentObject)
    })

    return clean
}

function updateView () {
    const template = document.querySelector("#student_template");
    const studentsContainer = document.querySelector("#students")

    studentsContainer.innerHTML = null

    sortedStudents = [...students].sort((a, b) => a[sortKey] > b[sortKey] ? sortOrder : sortOrder * -1)

    sortedStudents.forEach((student, index) => {
        const clone = template.cloneNode(true).content;
        clone.querySelector(".student").setAttribute('data-student-index', index)
        clone.querySelector(".student_firstname").textContent = student.firstname
        clone.querySelector(".student_lastname").textContent = student.lastname || '-'
        clone.querySelector(".student_house").textContent = student.house
        studentsContainer.appendChild(clone)
    });

    updateCount()
}

function updateCount () {
    document.querySelector('#count').textContent = students.length
}



function showPopup (studentElement) {
    const studentIndex = studentElement.getAttribute('data-student-index')
    const student = sortedStudents[studentIndex]
    // let prefect = null

    // if (prefect === true) {

    // }

    const popup = document.querySelector("#popup")
    popup.classList.add("show")

    popup.querySelector("#popup_fullname").textContent = student.fullname
    popup.querySelector("#popup_gender").textContent = student.gender
    popup.querySelector("#popup_house").textContent = student.house
    popup.querySelector("#popup_bloodstatus").textContent = student.bloodstatus
    if (student.imagePath) popup.querySelector("#popup_image").setAttribute('src', `images/${student.imagePath}.png`)
    if (student.crestPath) popup.querySelector("#crest_image").setAttribute('src', `images/${student.crestPath}.png`)

    const colorMap = {
        'Gryffindor': '#740001',
        'Slytherin': '#1A472A',
        'Ravenclaw': '#0E1A40',
        'Hufflepuff': '#FFDB00'

    }

    popup.style.background = colorMap[student.house]

}

function closePopup () {
    document.querySelector("#popup").classList.remove("show")
}

function sort (key) {
    if (sortKey === key) sortOrder *= -1
    else {
        sortKey = key
        sortOrder = 1
    }
    updateView()
}



let students = null
let sortedStudents = null
let sortKey = 'firstname'
let sortOrder = 1

async function initialize () {
    const data = await getData()
    const familyMap = {}
    data.familyData.half.forEach(lastname => familyMap[lastname] = 'Half')
    data.familyData.pure.forEach(lastname => familyMap[lastname] = 'Pure')
    students = cleanData(data.studentData, familyMap)
    updateView()
}

initialize()

