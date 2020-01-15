# Collaborative Data Science
CoClean: A System for Collaborative Data Cleaning


# Overview
Data scientist spend huge time curating their datasets and in many cases they need to work collabortivaly with other data scientists on certain tasks (e.g. labeling, error detecting, etc).
This framework allows data scientists to share and collaborate on their datasets through multiple interfaces (GUI, and Jupyter Notebooks).

# Getting Started with the Jupyter Notebook Interface
Using this framework allows you to share a dataframe with other collaborators via a single command while working within your jupyter notebook, even if other users are at remote locations. Remote users will be able to access a copy of the dataframe and work with the data. The framework will keep track of all updates and allow you to retreive them back or even see other users' modification realtime. All of this not only via simple commands, but also without you leaving your notebook!

This framework comes with a jupyter notebook extension that allows you to visually manage the shared dataframe. To use this framework in your jupyter notebook, a backend server needs to be running either on your local machine, or any other machine including the cloud services such as Azure, AWS, Google Cloud, etc, as long as that machine is accessiable by all collaborators.



### **Step 1: Starting the Backend Server**
First, Make sure you have [Docker](https://www.docker.com/) installed on the server machine. Then, Identify the IP address of this server. By default, we use ports 27017 and 3000 for MongoDB and GUI respectively, but you can configure them in the `.env` file. Make sure these ports are open in your server machine. 

**.env File:**

```yaml
MONGO_PORT=27017
GUI_PORT=3000
HOST=192.168.1.2
...
```


Clone the repository and navigate to the directory, modify the `.env` file as needed and then run the backend server using docker-compose:

```bash 
git clone https://github.com/qcri/collaborativedatascience.git
cd collaborativedatascience/
docker-compose up --detach db gui 
```


### **Step 2: Use Jupyter Notebooks on Your Local Machine**
For a quick start, you can use the Jupyter Notebook that is shipped with the framework. It has all the extensions installed and properly configured and you can run it via a single docker command. 

We use the port `8888` for Jupyter which is the default, but you can configure  `JUPYTER_PORT` in the `.env` file. Also Make sure you have updated the `HOST` in the `.env` file with your actual server ip from step 1 as described above.

```bash
# Skip this step if you have already cloned the repository
git clone https://github.com/qcri/collaborativedatascience.git 

cd collaborativedatascience/
docker-compose up notebook 
```

Now in your browser, navigate to `http://localhost:8888/` to access the notebooks. (Change the port if you have configured different port instead of 8888) 
Follow the example notebooks for more information.

#### Notes:
- Make sure the chosen port is not used by existing Jupyter process or any other process, otherwise the previous command would fail.
- The previous command will start a Jupyter process in an isolated docker container. So, even if you run the server (step 1) on the same machine, they both will be isolated. Therefore, in that case, make sure not to use `localhsot` or `0.0.0.0` or `127.0.0.1` for `HOST` in the `.env` file above and instead use the actual IP address of your machine.
- If you would like to use the framework on your current installation of Jupyter in your machine, follow this installation guide [here](https://github.com/qcri/collaborativedatascience/wiki/Installation-on-Current-Jupyter-Notebook). 






# Basic usage

Example notebooks are located in the directory `collaborativedatascience/notebook/examples`

```python
import collaborative_data_frame as cdf
import pandas as pd

df = pd.read_csv('examples/pima-indians-diabetes.csv')
df = cdf.CollaborativeDataFrame(df)

# use hostname to point to the server from step 1, default is 127.0.0.1
# df = cdf.CollaborativeDataFrame(df, hostname='10.4.4.20')

df.share()
```
Output:
```
http://10.0.0.27/dataset/5d914a23323c6cf98bd31999
```

To work with previously shared dataframes:
```python
df = cdf.CollaborativeDataFrame('http://10.0.0.27/dataset/5d914a23323c6cf98bd31999')
df.loc[0,'Age'] #updating some values like any dataframe
df.list_my_updates()
df.commit()
```
