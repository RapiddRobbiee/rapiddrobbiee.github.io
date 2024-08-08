const displayedImage = document.querySelector('.displayed-img');
const thumbBar = document.querySelector('.thumb-bar');

const btn = document.querySelector('button');
const overlay = document.querySelector('.overlay');

/* Declaring the array of image filenames */

const imageNames = ['pic1.jpg', 'pic2.jpg', 'pic3.jpg', 'pic4.jpg', 'pic5.jpg'];


/* Declaring the alternative text for each image file */
const altTexts = {
    pic1: 'Description for image 1',
    pic2: 'Description for image 2',
    pic3: 'Description for image 3',
    pic4: 'Description for image 4',
    pic5: 'Description for image 5',
  };
/* Looping through images */

for (let i = 0; i < imageNames.length; i++) {
    const img = document.createElement('img');
    img.src = `images/${imageNames[i]}`;
    img.alt = `Image ${i + 1}`;
    thumbBar.appendChild(img);
    
    img.addEventListener('click', () => {
        displayedImage.src = img.src;
        displayedImage.alt = img.alt;
    });
}


/* Wiring up the Darken/Lighten button */

btn.addEventListener('click', () => {
    console.log(btn.getAttribute("class"))  
if (btn.getAttribute("class") === "dark"){

    console.log(btn.getAttribute("class"))
btn.setAttribute("class", "light")
btn.textContent = "Lighten"
overlay.style.backgroundColor = "rgb(0 0 0 / 50%)";

}else if (btn.getAttribute("class") === "light"){ 
    console.log("shou;;d darkten")
btn.setAttribute("class", "dark")
btn.textContent = "Darken"
overlay.style.backgroundColor = "rgb(0 0 0 / 0%)"; }

})
