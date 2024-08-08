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

for (let i = 0; i < imageFiles.length; i++) {
    const img = document.createElement('img');
    img.src = `images/${imageFiles[i]}`;
    img.alt = `Image ${i + 1}`;
    thumbBar.appendChild(img);
    
    img.addEventListener('click', () => {
        displayedImg.src = img.src;
        displayedImg.alt = img.alt;
    });
}
const newImage = document.createElement('img');
newImage.setAttribute('src', xxx);
newImage.setAttribute('alt', xxx);
thumbBar.appendChild(newImage);

/* Wiring up the Darken/Lighten button */
