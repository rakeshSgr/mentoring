# Mentoring setup with Docker

## System Requirements

To set up the Elevate application, you'll need to have Docker and Docker Compose installed on your system. If you're using an Ubuntu server, you can follow the instructions in the following documentation to install Docker and Docker Compose: [How To Install and Use Docker Compose on Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-compose-on-ubuntu-20-04)

## Directory Setup

### Follow these steps to download the necessary files for the Elevate application:

1.  **Create Folders:** Open your terminal and create a folder named elevate and then a subfolder named backend.

    ```
    mkdir elevate
    cd elevate/
    mkdir backend
    cd backend
    ```

2.  **Download Docker Compose File:** Obtain the docker-compose-mentoring.yml file from the Elevate Mentoring repository and place it in the backend folder.
3.  **Create Subfolders for Services:** Because different services require distinct setup files, create separate folders for the mentoring and user services within the backend directory.

    ```
    mkdir mentoring
    mkdir user
    ```

4.  **Setup Mentoring Folder:** Navigate into the mentoring folder.

    ```
    cd mentoring
    ```

5.  **Download the required files for mentoring**
    Obtain the setup file and distribution column file for the mentoring service and place them in the mentoring folder. - Setup file of mentoring service - distributionColumn file of mentoring service
6.  **Change File Permissions:** Make the setup file executable.

    -   Ubuntu/Linux/Mac:

        ```
        cd /elevate/backend/mentoring
        chmod +x setup.sh
        ```

    -   Windows
        ```
        cd /elevate/backend/mentoring
        attrib +x setup.sh
        ```

7.  **Setup User Folder:** Navigate into the user folder.

    ```
    cd ../user
    ```

8.  **Download the required files for the user**
    Obtain the setup file and distribution column SQL file for the user service and place them in the user folder. - Setup file of user service - distributionColumn.sql file of user service
9.  **Change File Permissions:** Make the setup file executable.

    -   Ubuntu/Linux/Mac:

    ```
    cd /elevate/backend/user
    chmod +x setup.sh
    ```

    -   Windows

    ```
    cd /elevate/backend/user
    attrib +x setup.sh
    ```

## Environment File Creation

### Create an environment file for the Mentoring service by following these steps:

1. Navigate to the elevate/backend directory:

    ```
    cd elevate/backend
    ```

2. Create a new file named mentoring_env using a text editor like nano/notepad:

    - Ubuntu/Linux/Mac:

        ```
        $ nano mentoring_env
        ```

    - Windows
        ```
        $ notepad mentoring_env
        ```

3. Copy and paste the following environment variables into the mentoring_env file:

4. Save the changes to the file and exit the text editor.

We've included a link to the mentoring repository, allowing you to explore the code at your convenience.

### Create an environment file for the User service by following these steps:

1.  Navigate to the elevate/backend directory:

    ```
    cd elevate/backend
    ```

2.  Create a new file named user_env using a text editor like nano/notepad:

    -   Ubuntu/Linux/Mac:

        ```
        $ nano user_env
        ```

    -   Windows
        ```
        $ notepad user_env
        ```

3.  Copy and paste the following environment variables into the user_env file:

4.  Save the changes to the file and exit the text editor.

You've now created the user_env file with the necessary environment variables for the user service. You can utilize this file during the setup and configuration of the user service.

Additionally, we've provided a link to the user service repository for your exploration.

### Create an environment file for the Notification service by following these steps:

1. Navigate to the elevate/backend directory:

```
cd elevate/backend
```

2. Create a new file named notification_env using a text editor like nano/notepad:

-   Ubuntu/Linux/Mac:

```
$ nano notification_env
```

-   Windows

```
$ notepad notification_env
```

3. Copy and paste the following environment variables into the notification_env file:

4. Save the changes to the file and exit the text editor.

You've now created the notification_env file with the necessary environment variables for the notification service. You can utilize this file during the setup and configuration of the notification service.

Additionally, we've provided a link to the notification service repository for your exploration.

### Create an environment file for the Scheduler service by following these steps:

1. Navigate to the elevate/backend directory:

    ```
    cd elevate/backend
    ```

2. Create a new file named scheduler_env using a text editor like nano/notepad:

    - Ubuntu/Linux/Mac:

        ```
        $ nano scheduler_env
        ```

    - Windows
        ```
        $ notepad scheduler_env
        ```

3. Copy and paste the following environment variables into the scheduler_env file:

4. Save the changes to the file and exit the text editor.

You've now created the scheduler_env file with the necessary environment variables for the Scheduler service. You can utilize this file during the setup and configuration of the Scheduler service.

Additionally, we've provided a link to the scheduler service repository so that you can explore the code for yourself.

### Create an environment file for the Interface service by following these steps:

1. Navigate to the elevate/backend directory:

```
cd elevate/backend
```

2. Create a new file named interface_env using a text editor like nano/notepad:

-   Ubuntu/Linux/Mac:

```
$ nano interface_env
```

-   Windows

```
$ notepad interface_env
```

3. Copy and paste the following environment variables into the interface_env file:

4. Save the changes to the file and exit the text editor.

You've now created the interface_env file with the necessary environment variables for the interface service. You can utilize this file during the setup and configuration of the Interface service.

Additionally, we've provided a [link](https://github.com/ELEVATE-Project/interface-service) to the interface service repository so that you can explore the code for yourself.

### Create an environment file for the Interface service by following these steps:

1. Navigate to the elevate/backend directory:

    cd elevate/backend

2. Create a new file named `environment.ts`

3. Copy and paste the following environment variables into the `environment.ts` file:

    ```typescript
    export const environment = {
    	production: true,
    	name: 'debug environment',
    	staging: false,
    	dev: false,
    	baseUrl: 'http://localhost:3569',
    	sqliteDBName: 'mentoring.db',
    	deepLinkUrl: 'https://mentored.shikshalokam.org',
    	privacyPolicyUrl: 'https://shikshalokam.org/mentoring/privacy-policy',
    	termsOfServiceUrl: 'https://shikshalokam.org/mentoring/term-of-use',
    }
    ```

4. Update Docker Compose Configuration

    Open the `docker-compose-mentoring.yml` file and update the path of the `environment.ts` file under the portal docker image (refer to Line 160). Change `/home/priyanka/workspace/docker/environment.ts` to your exact path to the `environment.ts` file.

### To update all services with the latest image, follow these steps **(Optional)**:

Check the latest image in the Shikshalokam [Docker hub](https://hub.docker.com/r/shikshalokamqa/elevate-user/tags) repository. Note that the master branch typically has the latest published image.

## Run Docker Compose for Backend Services

1. Navigate to the elevate/backend directory:

    ```
    cd elevate/backend
    ```

2. Determine the exact location where the environment variables are stored by running the following command:

    ```
    pwd
    ```

3. Modify the file path before executing the command

    - **Ubuntu/Linux/Mac:**

        Replace `<exact_path_to_environment_files>` with the actual path you obtained.

        ```typescript
        notification_env="<exact_path_to_environment_files>/notification_env" \
        scheduler_env="<exact_path_to_environment_files>/scheduler_env" \
        mentoring_env="<exact_path_to_environment_files>/mentoring_env" \
        users_env="<exact_path_to_environment_files>/user_env" \
        interface_env="<exact_path_to_environment_files>/interface_env" \
        docker-compose -f docker-compose-mentoring.yml up
        ```

    - **Windows:**

        Use the exact location where the environment variables are stored before executing the command

        ```typescript
        $env:users_env = ".\user_env.txt";
        $env:interface_env = ".\interface_env.txt";
        $env:scheduler_env ="./scheduler_env.txt";
        $env:notification_env ="./notification_env.txt";
        $env:mentoring_env ="./mentoring_env.txt" ;
        docker-compose -f docker-compose-mentoring.yml up
        ```

        During the Docker run, the database, migration seeder files, and the script to establish the default organization will also execute automatically.

### Enable Citus Extension

### To enable the Citus extension for mentoring and user services, follow these steps:

1. Open a new terminal tab or window.

2. Navigate to the elevate/backend directory:

    ```
    cd /elevate/backend
    ```

3. Run the following command to enable the Citus extension for the user service:

    ```
    ./setup.sh postgres://postgres:postgres@localhost:5432/elevate-user
    ```

4. Run the following command to enable the Citus extension for the mentoring service:

    ```
    ./setup.sh postgres://postgres:postgres@localhost:5432/elevate-mentoring
    ```

## Stop Docker Containers

To stop the Docker containers, execute the following commands:

**Ubuntu/Linux/Mac:**

    notification_env="<exact_path_to_environment_files>/notification_env" \
    scheduler_env="<exact_path_to_environment_files>/scheduler_env" \
    mentoring_env="<exact_path_to_environment_files>/mentoring_env" \
    users_env="<exact_path_to_environment_files>/user_env" \
    interface_env="<exact_path_to_environment_files>/interface_env" \
    docker-compose -f docker-compose-mentoring.yml down

**Windows:**

       $env:users_env = ".\user_env.txt";
       $env:interface_env = ".\interface_env.txt";
       $env:scheduler_env ="./scheduler_env.txt";
       $env:notification_env ="./notification_env.txt";
       $env:mentoring_env ="./mentoring_env.txt" ; docker-compose -f docker-compose-mentoring.yml down

## View Running Containers

To view the running containers, use the command:

```
docker container ls
```

Login to the container:

```
docker exec -it ${container_id} bash
```

## Persist Database Data

**To persist the database data when bringing down the Docker containers, follow these steps to adjust the `docker-compose-mentoring.yml` file:**

Define a volume for each service in the volumes section of the `docker-compose-mentoring.yml` file. Adjust the path `/path/to/postgres/data` to your desired host machine path where you want to store the data. For example:

```yaml
services:
    user:
        volumes:
            - user_postgres_data:/path/to/postgres/data
    mentoring:
        volumes:
            - mentoring_postgres_data:/path/to/postgres/data
    notification:
        volumes:
            - notification_postgres_data:/path/to/postgres/data
```

List each volume separately under the volumes section:

```yaml
volumes:
    user_postgres_data:
    mentoring_postgres_data:
    notification_postgres_data:
```

With this setup, when you run `docker-compose down`, the data will be stored in the volumes, and it will persist even if you bring the containers down and then back up again using `docker-compose up`.

Make sure to replace `user` and `notification` with the actual service names from your `docker-compose-mentoring.yml` file. Adjust the volume names and paths according to your requirements.
