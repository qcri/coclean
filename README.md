# Collaborative Data Science
Collaborative Data Curation EcoSystem for Data Science


# Overview
Data scientist spend huge time curating their datasets and in many cases they need to work collabortivaly with other data scientists on certain tasks (e.g. labeling, error detecting, etc).
This framework allows data scientists to share and collaborate on their datasets through multiple interfaces (GUI, and Jupyter Notebooks).

# Getting Started with the Jupyter Notebook Interface
Using this framework allows you to share a dataframe with other collaborators via a single command while working within your jupyter notebook, even if other users are at remote locations. Remote users will be able to access a copy of the dataframe and work with the data. The framework will keep track of all updates and allow you to retreive them back or even see other users' modification realtime. All of this not only via simple commands, but also without you leaving your notebook!

This framework comes with a jupyter notebook extension that allows you to visually manage the shared dataframe. To use this framework in your jupyter notebook, a backend server needs to be running either on your local machine, or any other machine including the cloud services such as Azure, AWS, Google Cloud, etc, as long as that machine is accessiable by all collaborators and the port 27017 is open. 



### **Step 1: Starting the Backend Server**
First, Make sure you have [Docker](https://www.docker.com/) installed on the server machine. Then, Identify the IP address of this server and make sure the port 27017 is open

Next clone the repo and navigate to the directory and run it using docker-compose:

```bash 
git clone https://github.com/qcri/collaborativedatascience.git
cd collaborativedatascience/
docker-compose up --detach db gui 
```


### **Step 2: Use Jupyter Notebooks on Your Local Machine**
For a quick start, you can use the Jupyter Notebook that is shipped with the framework. It has all the extensions installed and properly configured and you can run it via a single docker command. 

Execute the following commands to start Jupyter Notebook, make sure to replace `SERVER_IP` with your actual server ip from step 1.

```bash
git clone https://github.com/qcri/collaborativedatascience.git
cd collaborativedatascience/
HOST=SERVER_IP docker-compose up notebook 
```

Now in your browser, navigate to `http://localhost:8888/` to access the notebooks. Follow the example notebooks for more information.

#### Notes:
- Jupyter uses the port 8888 by default, so make sure that port is not used by existing Jupyter process, otherwise the previous command would fail.
- The previous command will start a Jupyter Process in an isolated docker container. So, even if you run the server (step 1) on the same machine, they both will be isolated. Therefore, in that case, make sure not to use `localhsot` or `0.0.0.0` or `127.0.0.1` for `SERVER_IP` in the previous command and instead use the actual IP address of your machine.
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
http://127.0.0.1/dataset/5ce154fa01ea5499dcecb7a5
```

To work with previously shared dataframes:
```python
df = cdf.CollaborativeDataFrame('http://127.0.0.1/dataset/5ce154fa01ea5499dcecb7a5')
df.loc[0,'Age'] #updating some values like any dataframe
df.list_my_updates()
df.commit()
```