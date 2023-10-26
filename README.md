
# Chess

Chess game made in javascript 



## Run Locally

To run this project locally, you will need Docker. Follow these steps:

- Start by cloning the project repository to your local machine using the following command:
```bash
  git clone https://github.com/Bhuvansh-Goyal-IITB/Chess.git
```

- Move into the project directory using the following command:

```bash
  cd Chess
```

- Build the Docker image. You may need to use sudo permissions for Docker commands. Replace <image-name> with the desired name for your Docker image:
```bash
  docker build . -t <image-name>
```

- Launch the Docker container and map port 3000:

```bash
  docker run -p 3000:3000 <image-name>
```

