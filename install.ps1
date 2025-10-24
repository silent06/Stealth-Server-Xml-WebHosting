# Function to log messages to a log file
function Log-Message {
    param (
        [string]$message
    )
    $logFile = "install_log.txt"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -FilePath $logFile -Append
}

# Function to create a folder named 'xmls'
function Create-XmlsFolder {
    $folderPath = "xmls"
    if (-not (Test-Path -Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath | Out-Null
        Log-Message "Created folder '$folderPath'."
        Write-Host "Folder '$folderPath' created successfully."
    } else {
        Log-Message "Folder '$folderPath' already exists."
        Write-Host "Folder '$folderPath' already exists."
    }
}

# Function to check if Node.js and npm are installed
function Check-NodeNpm {
    # Check for Node.js
    $nodeCheck = Get-Command node -ErrorAction SilentlyContinue
    # Check for npm
    $npmCheck = Get-Command npm -ErrorAction SilentlyContinue

    if (-not $nodeCheck) {
        Log-Message "Node.js is not installed."
        Write-Host "Node.js is not installed."
        Write-Host "You can download and install Node.js from the official website: https://nodejs.org/"
        Write-Host "Follow the installation instructions provided on the site."
    } else {
        Log-Message "Node.js is installed."
        Write-Host "Node.js is installed."
    }

    if (-not $npmCheck) {
        Log-Message "npm is not installed."
        Write-Host "npm is not installed."
        Write-Host "npm is included with Node.js, so installing Node.js will also install npm."
        Write-Host "Please ensure you install Node.js from the official website: https://nodejs.org/"
    } else {
        Log-Message "npm is installed."
        Write-Host "npm is installed."
    }
}

# Function to download all XML files from a specified URL
function Download-XmlFiles {
    param (
        [string]$url,
        [string]$destinationFolder
    )

    # Get the HTML content of the URL
    $htmlContent = Invoke-WebRequest -Uri $url

    # Use regex to find all XML file links in the HTML content
    $xmlFiles = [regex]::Matches($htmlContent.Content, 'href="([^"]+\.xml)"') | ForEach-Object { $_.Groups[1].Value }

    foreach ($file in $xmlFiles) {
        # Construct the full URL for each XML file
        $fileUrl = "$url/$file"
        $localFilePath = Join-Path -Path $destinationFolder -ChildPath $file

        # Download the XML file
        Invoke-WebRequest -Uri $fileUrl -OutFile $localFilePath
        Log-Message "Downloaded $file from $fileUrl to $localFilePath."
        Write-Host "Downloaded $file from $fileUrl."
    }
}

# Call the function to create the xmls folder
Create-XmlsFolder

# Call the function to check for Node.js and npm
Check-NodeNpm

# Define the URL for XML files and call the download function
$xmlUrl = "http://192.99.58.184/xmls/xmls"
$destinationFolder = "xmls"

# Step 5: Download all XML files
Download-XmlFiles -url $xmlUrl -destinationFolder $destinationFolder

Write-Host "All XML files have been downloaded successfully."
Log-Message "All XML files have been downloaded successfully."


# Call the function to check for Node.js and npm
Check-NodeNpm

# Define the URL and the local file name
$url = "http://192.99.58.184/xmls/server.js"
$localFile = "server.js"

# Step 1: Download the JavaScript file
Invoke-WebRequest -Uri $url -OutFile $localFile
Log-Message "Downloaded $localFile from $url."

# Step 2: Initialize a new Node.js project
npm install
Log-Message "Initialized a new Node.js project."

# Step 3: Install necessary packages (if any are specified in package.json)


# Step 4: Create a batch script to start the Node.js server
$batScript = @"
@echo off
node $localFile
pause
"@

# Save the batch script to a .bat file
$batFileName = "start-server.bat"
$batScript | Set-Content -Path $batFileName
Log-Message "Created batch script $batFileName to start the server."

Write-Host "Download and installation complete. Use '$batFileName' to start the server."
Log-Message "Installation process completed successfully."
