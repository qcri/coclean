# Collaborative Data Science
Collaborative Data Curation EcoSystem for Data Science


# Overview
Data scientist spend huge time curating their datasets and in many cases they need to work collabortivaly with other data scientists on certain tasks (e.g. labeling, error detecting, etc).
This framework allows data scientists to share and collaborate on their datasets through multiple interfaces (GUI, and Jupyter Notebooks).

# Getting Started with the Jupyter Notebook Interface
First, Make sure you have [Docker](https://www.docker.com/) and [Jupyter Notebooks](https://jupyter.org/)

Next clone and navigate to the repo directory and install requirements:

```
git clone https://github.com/qcri/collaborativedatascience.git
cd collaborativedatascience
pip install -r requirements.txt
```

Start the backend:

```
cd server
docker-compose up
```




Now all you need is to import the file `collaborative_data_frame.py` in your notebooks. 



## Example notebooks: 
```
cd collaborativedatascience/notebook/examples
jupyter notebook
```


## Basic usage:

```python
import collaborative_data_frame as cdf
import pandas as pd

df = pd.read_csv('~/Downloads/pima-indians-diabetes.csv')
df = cdf.CollaborativeDataFrame(df)
df.share()
```
Output:
```
http://0.0.0.0:3000/dataset/5ce154fa01ea5499dcecb7a5
```

To work with previously shared dataframes:
```python
df = cdf.CollaborativeDataFrame('http://0.0.0.0:3000/dataset/5ce154fa01ea5499dcecb7a5')
df.loc[0,'Age'] #updating some values like any dataframe
df.list_my_updates()
df.commit()
```



