const image = document.getElementById('myImage');
const imageContainer = document.querySelector('.image-container');
const theMainMenu = document.querySelector('.theMainMenu');

const gameContainer = document.querySelector('.game-container');
const gameBg = document.getElementById('gameBg');


//const gameContainer = document.getElementById('.game-container');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
//const pauseOverlay = document.querySelector('.pauseOverlay');

let isGamePaused = false;
let lastFrameTime = Date.now();
let currentTime = 0;
let deltaTime = 0;


let canvasBgImage = new Image();
canvasBgImage.src = 'altbggrey.png'; // Set the correct path to your image file
let bgX = 0;
//bottom bar icons
const itemsCollectedBarY =  1060; // Position of the score bar starting from the bottom of the canvas
const PlayerLifeBarY = 1055;

//mouse movement etc
let sensitivity = 6; 
let maxVelocityX = 20; 
let isMouseHeld = false;
let lastMouseX, lastMouseTime;


const platforms = [];
const platformGenerationInterval = 650;
let platformSpeed = 2.5;

//unrelated to itemBar Icon sizing, but itemBar Icons = goodItemsImage
const goodItemsImage = new Image();
goodItemsImage.src = 'gooditem1.png';
let goodItems = [];
const goodItemLifespan = 4000; //good item despawn timer
const goodItemSpawnInterval = 7000; // good item spawn timer
let goodItemSpawnTimer = 0;
let goodItemRadius = canvas.width * 0.12;

/* fast!
//player
    jumpStrength: -11.9, 
    gravity: 0.28,
//platform
    const platformGenerationInterval = 500;
    let platformSpeed = 3.5;
    const bounceOffPlatformStrength = player.jumpStrength + 2.1; //strength off platform < initial jump

*/

/* slowish
//player
    jumpStrength: -9.9, 
    gravity: 0.15,
//platform
    const platformGenerationInterval = 650;
    let platformSpeed = 2.5;
//mouse movement
    let sensitivity = 6; 
    let maxVelocityX = 200;
*/

const player = {
    x: 0, 
    y: 0, 
    width: 66, 
    height: 60, 
    velocityY: 0, //player vert velocity
    jumpStrength: -9.9, 
    gravity: 0.15, 
    color: '#d4d4d4',
    secondaryColor: '#afafaf'
    //there's definitely a not-ridiculous-looking balance but this works
};

let playerColorsCycle = 
[
    '#FFF1AD',
    '#FCB0CD',
    '#D3AFE9',
    '#C0D9ED',
    '#FFDCAD',
    '#F1BBC9',
    '#B3FADA',
    '#F3BFB9',
    '#FFC9AD',
    '#FFB3AD',
    '#BEC6EF',
    '#ADF8FF',
    '#FDAFFA',
    '#C7E5CC'

];

function darkenColor(color, percent) {
    var num = parseInt(color.slice(1), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        B = (num & 0x00FF) - amt,
        G = (num >> 8 & 0x00FF) - amt;

    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

//pause if out-of-tab
function handleVisibilityChange() {
    if (document.hidden) {
        //stopPlatformGeneration(); 
        isGamePaused = true;
    } else {
        isGamePaused = false;
        //lastFrameTime = Date.now();
        //startPlatformGeneration(); 
    }
}

document.addEventListener("visibilitychange", handleVisibilityChange);

image.onload = function() {
    imageContainer.style.width = image.width + 'px';
    image.style.display = 'block';
    theMainMenu.style.display = 'none';
    gameCanvas.style.display = 'none';
    
    canvas.width = 680;
    canvas.height = 1120;
    //canvas.width = 720;
   // canvas.height = 1080;
  
    //player.width = 66;
    //player.height = 60;

    //beginning playerspawn
    player.x = canvas.width / 2 - player.width / 2; 
    player.y = canvas.height - player.height; 

//starts platform generation before user starts game
    //const initialPlatformCount = 0;
    //let staggerTime = 600; 

    //for (let i = 0; i <= initialPlatformCount; i++) {
    //    setTimeout(generatePlatform, i * staggerTime);
    //}
    
       //startPlatformGeneration();

    //requestAnimationFrame(gameLoop);
};

//scoring
let score = 0;
    function updateScore() {
        score++;
    }
    function displayScore() {
        
    }
    function resetScore() {
        score = 0;
    }


    let itemsCollected = 0;
    function updateItemsCollected() {
        itemsCollected++;
    }
    function resetItemsCollected() {
        itemsCollected = 0;
    }

//player colorizer
let currentPlayerColorIndex = 0;
const pciInterval = 4000; 
const playerColorChangerInterval = 20;
const playerColorChangerTimer = 0;

    function changePlayerColor() {
        currentPlayerColorIndex = (currentPlayerColorIndex + 1) % playerColorsCycle.length; // Cycle through the colors
        player.color = playerColorsCycle[currentPlayerColorIndex]; // Update the player's color
        player.secondaryColor = darkenColor(player.color, 30); // Update secondary color
    }

    setInterval(changePlayerColor, pciInterval);
//eye color
    function drawPlayerEyes(x, y) {
        // Organize eye drawing into its own function for clarity
        ctx.fillStyle = '#efefef'; 
        ctx.fillRect(x + 15, y + 14, 17, 16); // Left eye
        ctx.fillRect(x + 40, y + 14, 17, 16); // Right eye
    
        ctx.fillStyle = '#ffffff'; 
        ctx.fillRect(x + 17, y + 14, 15, 16); // Left eye
        ctx.fillRect(x + 42, y + 14, 15, 16); // Right eye
    
        ctx.fillStyle = '#444444'; 
        ctx.fillRect(x + 23, y + 17, 9, 10); // Left eye
        ctx.fillRect(x + 48, y + 17, 9, 10); // Right eye
    
        ctx.fillStyle = '#000000'; 
        ctx.fillRect(x + 25, y + 17, 7, 10); // Left eye
        ctx.fillRect(x + 50, y + 17, 7, 10); // Right eye
    }



//life icon properties
let PlayerLifeNumber = 3;

let playerLifeIcon = {
    x: 50,  // Start drawing from this X position
    y: 50,   // Y position might not be used since you have PlayerLifeBarY
    width: 45,
    height: 43,
    color: '#f5f5f5',  // Color of the life icon
};


    function renderPlayerLifeIcons(playerLifeIcon) {
        const startX = 490; // Starting X position for the life icons
        const spacing = 10; // Space between each icon
        const iconY = PlayerLifeBarY; // Y position of the icons

        ctx.fillStyle = playerLifeIcon.color;
        // Manually draw each life icon
        ctx.fillRect(startX, iconY, playerLifeIcon.width, playerLifeIcon.height);
        ctx.fillRect(startX + (playerLifeIcon.width + spacing), iconY, playerLifeIcon.width, playerLifeIcon.height);
        ctx.fillRect(startX + 2 * (playerLifeIcon.width + spacing), iconY, playerLifeIcon.width, playerLifeIcon.height);
    }


//platform properties
let shouldGeneratePlatforms = false;
let platformGenerationIntervalId;

    function startPlatformGeneration() {
        shouldGeneratePlatforms = true;
        
            platformGenerationIntervalId = setInterval(generatePlatform, platformGenerationInterval);
    }
    
    function stopPlatformGeneration() {
        //shouldGeneratePlatforms = false;
        //clearInterval(platformGenerationIntervalId);
        
    }
    
    function generatePlatform() {
        if (shouldGeneratePlatforms && !isGamePaused) {
            //const platformWidth = canvas.width / 5.85;
            //const platformHeight = canvas.height / 26;
            const platformWidth = 131;
            const platformHeight = 41;
            const maxX = canvas.width - platformWidth;
            const randomX = Math.random() * maxX;
    
            platforms.push({
                x: randomX,
                y: -platformHeight,
                width: platformWidth,
                height: platformHeight,
                color: '#ffffff', // Default color
                shadowColor: '#e7ebeb',
                isActive: true
            });
        }
    }
    
//removal/waste management
    function updatePlatforms() {
        
        for (let i = platforms.length - 1; i >= 0; i--) {
            const platform = platforms[i];
            if (platform.isActive) {
                platform.y += platformSpeed;
                if (platform.y > canvas.height - 80) {
                    platforms.splice(i, 1); 
                }
            }
        }
    }


//collision
let playerBox, platformBox;

    function getPlatformCollisionBox(platform) {
        return {
            x: platform.x,
            y: platform.y,
            width: platform.width,
            height: platform.height
        };
    }

    function getPlayerCollisionBox(player) {
        return {
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height
        };
    }

    function checkCollision(playerBox, platformBox) {
        return playerBox.x < platformBox.x + platformBox.width &&
            playerBox.x + playerBox.width > platformBox.x &&
            playerBox.y < platformBox.y + platformBox.height &&
            playerBox.y + playerBox.height > platformBox.y;
    }


//fixing collision
canvas.addEventListener('mousedown', (event) => {
    isMouseHeld = true;
    lastMouseX = event.clientX;
    lastMouseTime = Date.now();
});
let speed;
    canvas.addEventListener('mousemove', (event) => {
        if (isMouseHeld) {
            const currentMouseX = event.clientX;
            const currentMouseTime = Date.now();

            if (lastMouseTime && lastMouseX !== undefined) {
                const deltaX = currentMouseX - lastMouseX;
                const mouseEventDeltaTime = currentMouseTime - lastMouseTime;
                if (mouseEventDeltaTime > 0) { 
                    speed = deltaX / mouseEventDeltaTime; 
                    player.velocityX = Math.max(-maxVelocityX, Math.min(maxVelocityX, speed * sensitivity));
                }
            }

            lastMouseX = currentMouseX;
            lastMouseTime = currentMouseTime;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isMouseHeld = false;
        player.velocityX = 0;
    });

//collision response variables
const bottomCollisionIntensity = 0.8; //bounce-back, basically
const sideCollisionBuffer = 0.05; //compensation...
const bounceOffPlatformStrength = player.jumpStrength + 3; //strength off platform < initial jump

function handleCollisions() {
    const playerBox = getPlayerCollisionBox(player);
    platforms.forEach(platform => {
        const platformBox = getPlatformCollisionBox(platform);
        if (checkCollision(playerBox, platformBox)) {
            const onTopOfPlatform = player.velocityY >= 0 && (playerBox.y + playerBox.height - player.velocityY) <= platformBox.y;

            if (onTopOfPlatform) {
                // Landing on top of the platform
                player.y = platformBox.y - player.height;
                player.velocityY = bounceOffPlatformStrength;
                
                if (player.y > canvas.height - player.height) {
                    player.y = canvas.height - player.height;
                    player.velocityY = player.jumpStrength; 
                }
                updateScore();
            } else {

                
                const isMovingRight = player.velocityX > 0;
                const isMovingLeft = player.velocityX < 0;
    
                const collidingFromLeft = isMovingRight && playerBox.x + playerBox.width > platformBox.x && playerBox.x < platformBox.x;
                const collidingFromRight = isMovingLeft && playerBox.x < platformBox.x + platformBox.width && playerBox.x + playerBox.width > platformBox.x + platformBox.width;

                if (collidingFromLeft) {
                  player.x = platformBox.x - playerBox.width; 
                  player.velocityX = -player.velocityX * sideCollisionBuffer; //reverse direction
                } else if (collidingFromRight) {
                 player.x = platformBox.x + platformBox.width;
                 player.velocityX = -player.velocityX * sideCollisionBuffer;
                }
                //with bottom
                const isMovingUp = player.velocityY < 0;
                if (isMovingUp && playerBox.y < platformBox.y + platformBox.height) {
                    player.y = platformBox.y + platformBox.height; 
                    player.velocityY = -player.velocityY * bottomCollisionIntensity; 
                }
            }
        }
    });
}

    function updatePlayer() {
        if (isMouseHeld) {
            player.x += player.velocityX;
        }

player.velocityY += player.gravity;
player.y += player.velocityY;


const groundLevel = canvas.height - player.height - 80; //ground above bottom of canvas

    if (player.y > groundLevel) {
        player.y = groundLevel; 
        player.velocityY = player.jumpStrength; 
        resetScore();
    } else {
        handleCollisions();
    }

//allow for hand adjustment
if (!isMouseHeld) {
    player.velocityX = 0;
}

//canvas border handling
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

const rightBuffer = canvas.width - player.width - 16;
    if (player.x > rightBuffer) {
        player.x = rightBuffer; 
        player.velocityX = 0; 
    }

const leftBuffer = 16; 
    if (player.x < leftBuffer) {
        player.x = leftBuffer; 
        player.velocityX = 0; 
    }

const topBuffer = 48;
    if (player.y < topBuffer) {
        player.y = topBuffer; 
        player.velocityY = 0; 
    }

}


//item functions
function spawnGoodItem() {
    const newGoodItem = {
        x: Math.random() * (canvas.width - goodItemRadius * 2) + goodItemRadius,
        y: Math.random() * (canvas.height - goodItemRadius * 3) + goodItemRadius,
        spawnTime: Date.now()
    };
    goodItems.push(newGoodItem);
}

function updateGoodItems(currentTime) {
    goodItems = goodItems.filter(item => currentTime - item.spawnTime < goodItemLifespan);
}
function checkGoodItemCollection() {
    goodItems = goodItems.filter(item => {
        if (isPlayerCollidingWithGoodItem(player, item)) {
            itemsCollected += 1; // adds to itemsCollectedBar
            return false; 
        }
        return true; // Keep item
    });
}

function isPlayerCollidingWithGoodItem(player, item) {

    const closestX = clamp(item.x, player.x, player.x + player.width);
    const closestY = clamp(item.y, player.y, player.y + player.height);

    const dx = item.x - closestX;
    const dy = item.y - closestY;

    const distanceSquared = dx * dx + dy * dy;
    return distanceSquared < (goodItemRadius * goodItemRadius);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function updateGoodItemsSpawn() {
    if (!isGamePaused) {
        goodItemSpawnTimer += deltaTime;

        if (goodItemSpawnTimer >= goodItemSpawnInterval) {
            spawnGoodItem();
            goodItemSpawnTimer = 0; 
        }

        updateGoodItems(currentTime);
        checkGoodItemCollection();
    }
}

//itemsCollectedBar + icon properties
const iconWidth = 40; // Width of each icon in the score bar
const iconHeight = 40; // Height of each icon
const maxIcons = 10; //Math.floor((canvas.width / 2)/ iconWidth);

function renderItemsCollectedBar(itemsCollected) {
    let spacing = 16;
    for (let i = 0; i < itemsCollected; i++) {
        ctx.drawImage(goodItemsImage, ((i * iconWidth) + spacing), itemsCollectedBarY, iconWidth, iconHeight);
    }

}

// game end, win, etc
function checkWinCondition() {
    if (itemsCollected === maxIcons) {
        isGamePaused = true;  // Stop game updates and rendering
        winScreen();
    }
}

function winScreen() {
    canvas.classList.remove('canvas-cursor-hidden');
    ctx.fillStyle = "#000000";
    ctx.fillRect(canvas.width / 2 - 127, canvas.height / 3.75, 250, 90);  //keep going
    ctx.fillRect(canvas.width / 2 - 127, canvas.height / 2, 250, 90);     //menu    
    ctx.fillStyle = "white";
    ctx.font = "bold 35px Arial";
    ctx.fillText("Keep Going?", canvas.width / 2 - 110, canvas.height / 3.75 + 60);  // Check these coordinates
    ctx.fillText("Main Menu", canvas.width / 2 - 90, canvas.height / 2 + 60);  // Main Menu text

    canvas.addEventListener('click', handleClickWinScreen);
    //canvas.addEventListener('click', handleClickReturnTo);
}

function handleClickWinScreen(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is within the "Keep Going" button
    if (x > canvas.width / 2 - 127 && x < canvas.width / 2 + 123 &&
        y > canvas.height / 3.75 - 50 && y < canvas.height / 3.75 + 100) {
        canvas.removeEventListener('click', handleClickReturnTo);
        resetGame();
    }
}

function handleClickReturnTo(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x > canvas.width / 2 - 200 && x < canvas.width / 2 + 50 &&
        y > canvas.height / 2 - 50 && y < canvas.height / 2 + 100) {
        console.log("returned to MM");
        canvas.removeEventListener('click', handleClickWinScreen);
        canvas.removeEventListener('click', handleClickReturnTo);
       
        renderMainMenu();
    }
}



function resetGame() {
    score = 0;  // Reset score
    itemsCollected = 0;
    isGamePaused = false;  // Resume game updates and rendering
    platforms = [];  // Reset platforms
    goodItems = [];  // Reset collected items
    startGame();
}


function renderMainMenu() {
    // Clear canvas and show game canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    image.style.display = 'none';
    gameCanvas.style.display = 'block';
   
    // Draw menu background
    ctx.fillStyle = "#efefef";
    ctx.fillRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Draw Start Button
    drawButton(canvas.width / 2 - 130, canvas.height / 3.75, 250, 90, "Start Game", "black");   

    // Draw Settings Button
    drawButton(canvas.width / 2 - 130, canvas.height / 2, 250, 90, "Settings", "black");   

    // Render faux reflection for buttons
    //renderFauxReflection();

    // Event listener for Start and Settings buttons
    canvas.addEventListener('click', handleClickMainMenu);
}

function drawButton(x, y, width, height, text, color) {
    // Draw button background
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    // Draw button text
    ctx.fillStyle = "white";
    ctx.font = "bold 35px Arial";
    ctx.fillText(text, x + 20, y + height / 2 + 15);
}



function renderSettingsMenu() {
    // Clear canvas and show game canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    image.style.display = 'none';
    gameCanvas.style.display = 'block';

    // Back Button
    ctx.fillStyle = "blue";
    ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2, 250, 90);
    ctx.fillStyle = "white";
    ctx.font = "bold 35px Arial";
    ctx.fillText("Back", canvas.width / 2 - 110, canvas.height / 2 + 60);

    // Placeholder text for settings
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Settings Placeholder Text", canvas.width / 2 - 110, canvas.height / 3.75 + 60);

    // Event listener for Back button
    canvas.addEventListener('click', handleClickSettings);
}

function handleClickMainMenu(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x > canvas.width / 2 - 200 && x < canvas.width / 2 + 50 &&
        y > canvas.height / 3.75 - 50 && y < canvas.height / 3.75 + 100) {
        console.log("Start Button clicked");
        startGame();
        canvas.removeEventListener('click', handleClickMainMenu); // Remove listener after click
    } else if (x > canvas.width / 2 - 200 && x < canvas.width / 2 + 50 &&
        y > canvas.height / 2 - 50 && y < canvas.height / 2 + 100) {
        console.log("Settings Button clicked");
        renderSettingsMenu();
        canvas.removeEventListener('click', handleClickMainMenu); // Remove listener after click
    }
}

function handleClickSettings(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x > canvas.width / 2 - 200 && x < canvas.width / 2 + 50 &&
        y > canvas.height / 2 - 50 && y < canvas.height / 2 + 100) {
        console.log("Back Button clicked");
        renderMainMenu();
        canvas.removeEventListener('click', handleClickSettings); // Remove listener after click
    }
}


function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save(); // Save the initial state once at the start of rendering
    
    // Background
    ctx.drawImage(canvasBgImage, 0, 0);

    
    // Platform shadows
    platforms.forEach((platform) => {
        ctx.fillStyle = '#e1e2e3'; // Light shadow color
        ctx.fillRect(platform.x - 4, platform.y - 4, platform.width + 2, platform.height + 2);
        ctx.fillStyle = platform.color; // Actual platform color
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Borders
    ctx.fillStyle = '#525252';
    ctx.fillRect(0, 0, canvas.width, 16);
    ctx.fillRect(0, canvas.height - 88, canvas.width, canvas.height);
    ctx.fillRect(0, 0, 16, canvas.height);
    ctx.fillRect(canvas.width - 16, 0, 16, canvas.height);

    //score visual
    ctx.fillStyle = '#000000'; 
    ctx.font = 'bold 35px Arial'; 
    ctx.fillText(score, canvas.width*0.048, canvas.height*0.05);

    
    renderItemsCollectedBar(itemsCollected);
    renderPlayerLifeIcons(playerLifeIcon);

    // Player Visuals
    // Outer square of the player
    ctx.fillStyle = player.secondaryColor; 
    ctx.fillRect(player.x - 3, player.y - 3, 69, 63); 

    // Inner square, player collision box visual
    ctx.fillStyle = player.color; 
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Eyes
    drawPlayerEyes(player.x, player.y);

    // Good Items
    goodItems.forEach(goodItem => {
        const diameter = goodItemRadius * 2;
        ctx.drawImage(goodItemsImage, goodItem.x - goodItemRadius, goodItem.y - goodItemRadius, diameter, diameter);
        ctx.drawImage(goodItemsImage, goodItem.x - goodItemRadius, goodItem.y - goodItemRadius, diameter, diameter);

    });
    

    //ctx.restore(); // Restore at the end of all drawing to revert to initial state
}




function startGame() {
    canvas.classList.add('canvas-cursor-hidden');
    startPlatformGeneration();
    requestAnimationFrame(gameLoop);

}


function gameLoop() {
    if (!isGamePaused) {
        currentTime = Date.now();
        deltaTime = currentTime - lastFrameTime;
        
        updatePlatforms();
        //startPlatformGeneration();
        updatePlayer();
        updateGoodItemsSpawn();
        handleCollisions();
        //updateBackground();
        
        render();
        
        
        lastFrameTime = currentTime;
    }
    
    checkWinCondition();
    requestAnimationFrame(gameLoop);  // Always request the next frame
}

// Function to replace the image with the main menu
function replaceWithMainMenu() {
    image.style.display = 'none';
    theMainMenu.style.display = 'block';
}

// Add event listener to the image to trigger the replacement
image.addEventListener('click', renderMainMenu);

