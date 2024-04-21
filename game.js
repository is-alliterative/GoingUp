const image = document.getElementById('myImage');
const imageContainer = document.querySelector('.image-container');

const gameContainer = document.querySelector('.game-container');


//const gameContainer = document.getElementById('.game-container');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseOverlay = document.querySelector('.pauseOverlay');

let isGamePaused = false;

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
    width: 0, 
    height: 0, 
    velocityY: 0, //player vert velocity
    jumpStrength: -9.9, 
    gravity: 0.15, 
    color: '#9886de',
    shadowColor: '#8374BE'
    //there's definitely a not-ridiculous-looking balance but this works
};
 
//mouse movement
let sensitivity = 6; 
let maxVelocityX = 20; 

const goodItemsImage = new Image();
goodItemsImage.src = 'gooditem1.png';
 


const platforms = [];
const platformGenerationInterval = 650;
let platformSpeed = 2.5;


let goodItems = [];
const goodItemLifespan = 4000; //good item despawn timer
const goodItemSpawnInterval = 7000; // good item spawn timer
let goodItemSpawnTimer = 0;
//const otherItemHeight = 50;
//const otherItemWidth = 50;
let goodItemRadius = canvas.width * 0.12;


let lastFrameTime = Date.now();
let currentTime = 0;
let deltaTime = 0;

const itemsCollectedBarHeight = -766; // Height of the score bar
const itemsCollectedBarY = canvas.height - (itemsCollectedBarHeight); // Position of the score bar starting from the bottom of the canvas



//img->gamecanvas event listener
function toggleVisibility() {
    image.style.display = 'none'; // Hide the image
    image.removeEventListener('click', toggleVisibility); // Remove the event listener to prevent further toggling
    
}


image.addEventListener('click', toggleVisibility);


// Add the click event listener to the image
image.addEventListener('click', toggleVisibility);


    let shouldGeneratePlatforms = false;

    let platformGenerationIntervalId;

    function startPlatformGeneration() {
        shouldGeneratePlatforms = true;
        if (!isGamePaused) {
            platformGenerationIntervalId = setInterval(generatePlatform, platformGenerationInterval);
        }
    }
    
    function stopPlatformGeneration() {
        shouldGeneratePlatforms = false;
        clearInterval(platformGenerationIntervalId);
    }
    
// stop plat gen out-of-tab
    function handleVisibilityChange() {
        if (document.hidden) {
            stopPlatformGeneration(); 
        } else {
            startPlatformGeneration(); 
        }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange);



    function generatePlatform() {
        if (shouldGeneratePlatforms && !isGamePaused) {
            const platformWidth = canvas.width / 5.85;
            const platformHeight = canvas.height / 26;
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
    
    //platform removal/waste management
    function updatePlatforms() {
        
        for (let i = platforms.length - 1; i >= 0; i--) {
            const platform = platforms[i];
            if (platform.isActive) {
                platform.y += platformSpeed;
                if (platform.y > canvas.height) {
                    platforms.splice(i, 1); 
                }
            }
        }
    }

    //loading everything first
    image.onload = function() {
        imageContainer.style.width = image.width + 'px';
        image.style.display = 'block';
        gameCanvas.style.display = 'none';
        
        
        canvas.width = 640;
        canvas.height = 960;
      
        // i might need to 'troubleshoot' this concept...works w/ current size at least
        player.width = canvas.width / 9.5;
        player.height = player.width;

        //beginning playerspawn
        player.x = canvas.width / 2 - player.width / 2; 
        player.y = canvas.height - player.height; 

        //so right now this also affects future platform-gen...
        const initialPlatformCount = 1;
        let staggerTime = 600; 

    for (let i = 0; i < initialPlatformCount; i++) {
        setTimeout(generatePlatform, i * staggerTime);
    }
        startPlatformGeneration();
    
    requestAnimationFrame(gameLoop);
    };


let score = 0;


function updateScore() {
    score++;
}

function displayScore() {
 
}

function resetScore() {
    score = 0;
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

let isMouseHeld = false;
let lastMouseX;
let lastMouseTime;

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
                    player.velocityY = player.jumpStrength;}
                
            } else {

                
                const isMovingRight = player.velocityX > 0;
                const isMovingLeft = player.velocityX < 0;
    
                const collidingFromLeft = isMovingRight && playerBox.x + playerBox.width > platformBox.x && playerBox.x < platformBox.x;
                const collidingFromRight = isMovingLeft && playerBox.x < platformBox.x + platformBox.width && playerBox.x + playerBox.width > platformBox.x + platformBox.width;

                if (collidingFromLeft) {
                  player.x = platformBox.x - playerBox.width; // Position player to the left of the platform
                  player.velocityX = -player.velocityX * sideCollisionBuffer; // Reverse direction
                } else if (collidingFromRight) {
                 player.x = platformBox.x + platformBox.width; // Position player to the right of the platform
                 player.velocityX = -player.velocityX * sideCollisionBuffer; // Reverse direction
                }
                // Handling collision from below
                const isMovingUp = player.velocityY < 0;
                if (isMovingUp && playerBox.y < platformBox.y + platformBox.height) {
                    player.y = platformBox.y + platformBox.height; // Position player below the platform
                    player.velocityY = -player.velocityY * bottomCollisionIntensity; // Reverse and reduce vertical velocity for bounce
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

    // Set new ground level to be 48px above the bottom of the canvas
    const groundLevel = canvas.height - player.height - 48;

    // if player hits new ground line -> score reset
    if (player.y > groundLevel) {
        player.y = groundLevel; // Position player right on the new ground level
        player.velocityY = player.jumpStrength; // Apply jump strength as a bounce effect
        resetScore();
    } else {
        handleCollisions();
    }

    // Contain the player within the canvas horizontally
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    // Reset horizontal velocity if the mouse is not held
    if (!isMouseHeld) {
        player.velocityX = 0;
    }


    const rightBuffer = canvas.width - player.width - 12;
        if (player.x > rightBuffer) {
            player.x = rightBuffer; // Position player right at the buffer limit
            player.velocityX = 0; // Stop horizontal movement
        }

    const leftBuffer = 12; // 12 pixels from the left edge of the canvas
        if (player.x < leftBuffer) {
            player.x = leftBuffer; // Position player right at the buffer limit
            player.velocityX = 0; // Stop horizontal movement
        }

    const topBuffer = 12;
        if (player.y < topBuffer) {
            player.y = topBuffer; // Position player right at the buffer limit
            player.velocityY = 0; // Stop horizontal movement
        }

}

function spawnGoodItem() {
    const newGoodItem = {
        x: Math.random() * (canvas.width - goodItemRadius * 2) + goodItemRadius,
        y: Math.random() * (canvas.height - goodItemRadius * 3) + goodItemRadius,
        spawnTime: Date.now()
    };
    goodItems.push(newGoodItem);
}

function updateGoodItems(currentTime) {
   // console.log("Items before update:", goodItems.length); // Debugging line
    goodItems = goodItems.filter(item => currentTime - item.spawnTime < goodItemLifespan);
   // console.log("Items after update:", goodItems.length); // Debugging line}
}
function checkGoodItemCollection() {
    goodItems = goodItems.filter(item => {
        if (isPlayerCollidingWithGoodItem(player, item)) {
            score += 1; // Increase score
            return false; 
        }
        return true; // Keep item
    });
}

//player item collision
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

const iconWidth = 40; // Width of each icon in the score bar
const iconHeight = 40; // Height of each icon
const maxIcons = 16;
//Math.floor(canvas.width / iconWidth); // Number of icons that can fit in the score bar

function renderItemsCollectedBar(score) {
    for (let i = 0; i < score; i++) {
        ctx.drawImage(goodItemsImage, i * iconWidth, itemsCollectedBarY, iconWidth, iconHeight);
    }
}

function checkWinCondition() {
    if (score === maxIcons) {
        winGame();
    }
}

function displayPlayAgainButton() {
    ctx.fillStyle = "green";
    ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 + 50, 100, 50);  // Make sure dimensions are visible
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Play Again", canvas.width / 2 - 40, canvas.height / 2 + 80);  // Check these coordinates

    canvas.addEventListener('click', function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if click is within the button
        if (x > canvas.width / 2 - 50 && x < canvas.width / 2 + 50 &&
            y > canvas.height / 2 + 50 && y < canvas.height / 2 + 100) {
            resetGame();
            canvas.removeEventListener('click', handleClick); // Remove listener to prevent multiple resets
        }
    }, { once: true });  // Ensure listener is added only once
    
}

function resetGame() {
    score = 0;  // Reset score
    isGamePaused = false;  // Resume game updates and rendering
    platforms = [];  // Reset platforms
    goodItems = [];  // Reset collected items

    // Further initialization as needed

    startPlatformGeneration(); // Start platform generation
    requestAnimationFrame(gameLoop); // Reinitiate the game loop
}


function winGame() {
    isGamePaused = true;  // Stop game updates and rendering
    stopPlatformGeneration();  // Stop generating platforms
    displayPlayAgainButton();  // Make sure this function is called
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Platforms with shadow
    ctx.save(); // Save the current state to preserve settings
    ctx.shadowOffsetX = -4; // Horizontal offset of the shadow
    ctx.shadowOffsetY = -4; // Vertical offset of the shadow
    ctx.shadowBlur = 5; // How much the shadow should blur
     // Shadow color, semi-transparent black

    platforms.forEach((platform) => {
        ctx.fillStyle = platform.color; // Use color defined in platform object
        ctx.shadowColor = platform.shadowColor;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    ctx.restore(); // Restore the original state to disable shadow for other elements
   
    ctx.fillStyle = '#D9D9D9';
    ctx.fillRect(0,0, canvas.width, 12);
    ctx.fillRect(0,canvas.height - 48, canvas.width, canvas.height);
    ctx.fillRect(0,0,12,canvas.height);
    ctx.fillRect(canvas.width - 12,0,12,canvas.height);

    renderItemsCollectedBar(score);

    // Player
    ctx.save();
    ctx.shadowOffsetX = -3; // Horizontal offset of the shadow
    ctx.shadowOffsetY = -3; // Vertical offset of the shadow
    ctx.shadowBlur = 1; // How much the shadow should blur
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.shadowColor;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.restore();

    // Good Items
    goodItems.forEach(goodItem => {
    //    ctx.fillStyle = "yellow";
        const diameter = goodItemRadius * 2;
        ctx.drawImage(goodItemsImage, goodItem.x - goodItemRadius, goodItem.y - goodItemRadius, diameter, diameter);
    });
}

function startGame() {

    image.style.display = 'none';
    gameCanvas.style.display = 'block';  // Explicitly set the canvas display
}


function gameLoop() {
    if (!isGamePaused) {
        currentTime = Date.now();
        deltaTime = currentTime - lastFrameTime;

        updatePlatforms();
        updatePlayer();
        updateGoodItemsSpawn();
        handleCollisions();
        
        //render();

        lastFrameTime = currentTime;
    }
    render();
    checkWinCondition();
    requestAnimationFrame(gameLoop);  // Always request the next frame
}


image.addEventListener('click', startGame);

