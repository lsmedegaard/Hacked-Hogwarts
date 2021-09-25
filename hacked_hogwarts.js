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

        const crestPath = house.toLowerCase()

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

    const filteredStudents = [...students].filter(student => {
        return houseFilters.includes(student.crestPath)
        && (showExpelledStudents
        ? expelledStudents.includes(student)
        : !expelledStudents.includes(student))
        && student.fullname.toLowerCase().includes(searchString)
    })

    sortedStudents = filteredStudents.sort((a, b) => a[sortKey] > b[sortKey] ? sortOrder : sortOrder * -1)

    if (hacked) {
        sortedStudents.push(lasseObject)
        sortedStudents.forEach(student => {
            if (student.bloodstatus === 'Pure') {
                student.bloodstatus = ['Half', 'Unknown'][Math.floor(Math.random() * 2)]
            } else student.bloodstatus = 'Pure'
        })
    }

    sortedStudents.forEach((student, index) => {
        student.listIndex = index
        const clone = template.cloneNode(true).content;
        clone.querySelector(".student_info").setAttribute('data-student-index', index)
        clone.querySelector(".expel").setAttribute('data-student-index', index)
        clone.querySelector(".prefect").setAttribute('data-student-index', index)
        clone.querySelector(".student_firstname").textContent = student.firstname
        clone.querySelector(".student_lastname").textContent = student.lastname || '-'
        clone.querySelector(".student_house").textContent = student.house
        if (student.house === 'Slytherin' && student.bloodstatus === 'Pure') clone.querySelector(".inq_squad").classList.add('show')
        studentsContainer.appendChild(clone)
    });

    updateCount()
}

function updateCount () {
    const countsDiv = document.querySelector('#counts')
    const houses = [ 'gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff' ]
    houses.forEach(house => {
        countsDiv.querySelector(`#${house} .count`).textContent = students.filter(student => student.crestPath === house).length
    })
    countsDiv.querySelector('#total .count').textContent = students.length
    countsDiv.querySelector('#listed .count').textContent = sortedStudents.length
    countsDiv.querySelector('#expelled .count').textContent = expelledStudents.length
}



function showPopup (studentElement) {
    const studentIndex = studentElement.getAttribute('data-student-index')
    const student = sortedStudents[studentIndex]

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

function toggleHouseFilter (house) {
    const houseFilterElement = document.querySelector(`#${house}`)
    if (houseFilters.includes(house)) {
        houseFilters.splice(houseFilters.indexOf(house), 1)
        houseFilterElement.classList.add('unselected')
    } else {
        houseFilters.push(house)
        houseFilterElement.classList.remove('unselected')
    }
    updateView()
}

function expelStudent (studentElement) {
    const studentIndex = studentElement.getAttribute('data-student-index')
    const student = sortedStudents[studentIndex]
    if (student.firstname === 'Lasse') {
        document.querySelector('#warning').classList.add('show')
        setTimeout(() => {
            document.querySelector('#warning').classList.remove('show')
        }, 2000)
        return null
    }
    expelledStudents.push(student)
    updateView()
}
 
function toggleExpelledStudents () {
    showExpelledStudents = !showExpelledStudents
    document.querySelector('#expelled_filter').classList.toggle('strong')
    updateView()
}

function togglePrefects (studentElement) {
    const studentIndex = studentElement.getAttribute('data-student-index')
    const student = sortedStudents[studentIndex]
    student.prefect = !student.prefect
    if (prefects[student.crestPath].includes(student)) {
        prefects[student.crestPath].splice(prefects[student.crestPath].indexOf(student), 1)
        studentElement.classList.remove('selected')
    } else if (prefects[student.crestPath].length === 2) {
        const removedStudent = prefects[student.crestPath].splice(0, 1)[0]
        document.querySelector(`.prefect[data-student-index="${removedStudent.listIndex}"`).classList.remove('selected')
        prefects[student.crestPath].push(student)
        studentElement.classList.add('selected')
    } else {
        prefects[student.crestPath].push(student)
        studentElement.classList.add('selected')
    }
}

function toggleInqSquad (studentElement) {
    studentElement.classList.toggle('selected')
    if (hacked) setTimeout(() => {
        studentElement.classList.remove('selected')
    }, 3000)
}

function search (searchInput) {
    searchString = searchInput.value
    updateView()
}

function hackTheSystem() {
    hacked = true
    updateView()
}

let searchString = ''
let students = null
let sortedStudents = null
let sortKey = 'firstname'
let sortOrder = 1
let houseFilters = [ 'gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff' ]
let expelledStudents = []
let showExpelledStudents = false
let prefects = {
    'gryffindor': [],
    'slytherin': [],
    'ravenclaw': [],
    'hufflepuff': [],
}
let hacked = false
let lasseObject = {
    fullname: 'Lasse Mark Smedegaard',
    firstname: 'Lasse',
    middlename: 'Mark',
    lastname: 'Smedegaard',
    bloodstatus: 'Pure',
    house: 'Ravenclaw',
    crestPath: 'ravenclaw',
    imagePath: 'smedegaard-l'
}

async function initialize () {
    const data = await getData()
    const familyMap = {}
    data.familyData.half.forEach(lastname => familyMap[lastname] = 'Half')
    data.familyData.pure.forEach(lastname => familyMap[lastname] = 'Pure')
    students = cleanData(data.studentData, familyMap)
    updateView()
}

initialize()

