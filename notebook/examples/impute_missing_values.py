import random
def impute_missing_values(df):
    df.loc[df['Body mass index']==0,'Body mass index'] = random.randint(15,30)
    print('done')