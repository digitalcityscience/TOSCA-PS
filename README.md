# Toolkit for Open and Sustainable City Planning and Analysis
Welcome to the Toolkit for Open and Sustainable City Planning and Analysis!

The Toolkit for Open and Sustainable City Planning and Analysis (TOSCA) was developed in cooperation between the Digital City Science of the HafenCity University Hamburg (HCU) and Deutsche Gesellschaft für Internationale Zusammenarbeit GmbH (GIZ) in India and Ecuador. It is an open source tool and the software for this project is based entirely on open source components. TOSCA is a web-based geographic information system (GIS) for multi-touch tables that is optimised for the use by non-GIS-experts. It supports integrated and participatory urban planning processes, fostering dialogue between governments and citizens and exchange of knowledge and data between government departments. The main functionality of the TOSCA is to visualise and analyse complex urban data, jointly among local practitioners and with citizens.

https://user-images.githubusercontent.com/66685611/122094650-af3ef400-ce0c-11eb-91a1-b8b271720a36.mp4

You can also look under the Wiki section to read the [administrator's](https://github.com/digitalcityscience/TOSCA/wiki/2.-Open-City-Toolkit-%E2%80%90-Administrator's-Guide) manual or the [user](https://github.com/digitalcityscience/TOSCA/wiki/1.-Open-City-Toolkit-%E2%80%90-User-manual) manual.

## Installation

In order to deploy TOSCA, you need a server that runs a recent version of [Docker](https://docs.docker.com/) and that is accessible from the internet (or intranet).

Clone this repository onto your server. Before building and starting the stack with [Docker Compose](https://docs.docker.com/compose/), take a look at the `docker-compose.yaml` file in the root directory of your clone. In this file the services comprising the TOSCA stack are defined:

- `geoserver`: the *GeoServer* backend that keeps your geodata
- `db`: the *mongoDB* database for project metadata and user input
- `api`: the *Node.js* backend that provides read and write access to the database
- `webapp`: the *Vue.js* frontend

Make sure that the ports defined in the file are free to use. If some of the ports cannot be used, change them, but be careful to change them in all places where they are defined.

Then, set up the configuration of the `webapp` container. Find the file `webapp/.env.example` and create a copy, `webapp/.env`. There, replace the default values with the correct values for your setup.

- `VITE_API_URL` = the URL at which the client can reach the `api` service - this consists of the protocol (http or https), the IP address or hostname of your server, and the port number
- `VITE_LATITUDE` = initial center of the map: latitude
- `VITE_LONGITUDE` = initial center of the map: longitude
- `VITE_GEOSERVER_URL` = the URL at which the client can reach the `geoserver` service
- `VITE_GEOSERVER_USERNAME` = the username used to authenticate with the GeoServer
- `VITE_GEOSERVER_PASSWORD` = the password used to authenticate with the GeoServer
- `VITE_GEOSERVER_DMP_WORKSPACE` = the name of the GeoServer workspace in which the DMP layers will be stored

When everything is set up, run this command to bring the services up for the first time:

```
docker compose up
```

If there are no errors, the frontend will become available at your server's IP address or hostname, port 80.
