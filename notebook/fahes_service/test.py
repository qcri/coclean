import fahes_api
import pandas as pd


df = pd.read_csv ('~/Downloads/pima-indians-diabetes.csv')

print(fahes_api.callFahes_w_df(df, 'results'))