# Collaborative Data Science
Collaborative Data Curation EcoSystem for Data Science


# Overview
Data scientist spend huge time curating their datasets and in many cases they need to work collabortivaly with other data scientists on certain tasks (e.g. labeling, error detecting, etc).
This framework allows data scientists to share and collaborate on their datasets through multiple interfaces (GUI, and Jupyter Notebooks).

# Getting Started with the Jupyter Notebook Interface
Using this framework allows you to share a dataframe with other collaborators via a single command while working within your jupyter notebook, even if other users are at remote locations. Remote users will be able to access a copy of the dataframe and work with the data. The framework will keep track of all updates and allow you to retreive them back or even see other users' modification realtime. All of this not only via simple commands, but also without you leaving your notebook!

This framework comes with a jupyter notebook extension that allows you to visually manage the shared dataframe. To use this framework in your jupyter notebook, a backend server needs to be running either on your local machine, or any other machine including the cloud services such as Azure, AWS, Google Cloud, etc, as long as that machine is accessiable by all collaborators and the port 27017 is open. 



### **Starting the Backend Server**
First, Make sure you have [Docker](https://www.docker.com/) installed on the server machine. 

Next clone the repo and navigate to server directory and run it using docker-compose:

```
git clone https://github.com/qcri/collaborativedatascience.git
cd collaborativedatascience/server
docker-compose up --detach  
```


### **Use Jupyter Notebooks on Your Local Machine**
Make sure you have [Jupyter Notebooks](https://jupyter.org/) installed on your local mahcine. Clone the repo and install the requirments:

```
git clone https://github.com/qcri/collaborativedatascience.git
cd collaborativedatascience/
pip install -r requirements.txt
```

Enable Extensions: 
```
jupyter nbextension enable --py --sys-prefix qgrid
jupyter nbextension enable --py --sys-prefix widgetsnbextension
```

Start Jupyter Notebook: 
```
jupyter notebook
```

Now all you need is to import the file `collaborative_data_frame.py` in your notebooks. 

Example notebooks are located in the directory `collaborativedatascience/notebook/examples`


# Basic usage

```python
import collaborative_data_frame as cdf
import pandas as pd

df = pd.read_csv('pima-indians-diabetes.csv')
df = cdf.CollaborativeDataFrame(df)
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



