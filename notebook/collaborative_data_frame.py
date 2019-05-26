import pandas as pd
import qgrid.grid

from pymongo import MongoClient
from io import StringIO
from bson.objectid import ObjectId
from bson.timestamp import Timestamp

import math
import collections
import threading
import time

from functools import reduce


from ipywidgets.widgets import Button, VBox, HBox


class CollaborativeDataFrame(pd.DataFrame):
    def __init__(self, data, *args, **kwargs):
        url = None
        db_client = MongoClient('mongodb://localhost:27017,localhost:27018,localhost:27019/db?replicaSet=my-mongo-set')
        if isinstance(data, pd.DataFrame):
            df = data

        elif isinstance(data, str):
            # TODO fetch the data from url. temprarily we are using mongodb
            
            url = data
            id = url[-24:]
            data = db_client.db.datasets.find_one({'_id':ObjectId(id)})['data']
            df = pd.read_csv(StringIO(data), index_col=0)
            
        else:
            raise ValueError('data must be either a DataFrame instance to be shared, or a string id of a previously shared DataFrame.')

        pd.DataFrame.__init__(self, df.copy())
        self.db_client = db_client
        self.url = url
        self.user_id = '' or kwargs.get('user_id', None)
        self.original_df = df
        self.collaborators = collections.defaultdict(lambda: pd.DataFrame().reindex_like(df))

        if self.url:
            self.monitor_changes()

        self.setup_widget()

    def monitor_changes(self):
        id = self.url[-24:]
        def get_dataset_timestamp():
            # logic from https://github.com/nswbmw/objectid-to-timestamp
            seconds = int(id[0:8], 16)
            increament = math.floor(int(id[-6:], 16) / 16777.217)
            return Timestamp(seconds, increament)

        def handle_changes():
            with self.db_client.db[id].watch(start_at_operation_time=get_dataset_timestamp()) as stream:
                for change in stream:
                    document = change['fullDocument']
                    user_id, index, column, new_value = [document[key] for key in ['user_id', 'index', 'column', 'new_value']]
                    self.collaborators[user_id].loc[index, column] = new_value

        def handle_uploads():
            self.last_update = pd.DataFrame().reindex_like(self.original_df)
            while True:
                new_updates = self.mask((self == self.original_df) | (self == self.last_update))
                for (index, column), new_value in new_updates.stack().iteritems():
                    self.db_client.db[id].update( 
                        {'index':index, 'column':column, 'user_id': self.user_id},
                        {'index':index, 'column':column, 'user_id': self.user_id, 'new_value':new_value},
                        upsert=True )
                    self.last_update.loc[index,column] = new_value
                
                time.sleep(1)

        threading.Thread(target=handle_changes).start()
        threading.Thread(target=handle_uploads).start()

    def commit(self, *args, **kwargs):
        print('will commit here') 

    def refresh(self, *args, **kwargs):
        self.grid_widget.df = self

    def list_my_updates(self):
        return self.mask(self == self.original_df).stack()

    def resolve(self, policy):
        resolved = self.copy()
        counts = reduce(lambda df1, df2: df1 + df2, [df.notnull().astype('int') for df in  self.collaborators.values()])
        to_resolve = counts.mask(counts<policy['at_least']).stack()
        for (row,col), ـ in to_resolve.iteritems():
            values = [df.loc[row,col] for df in self.collaborators.values()]
            if policy['option'] == 'majority_vote':
                # TODO Handle Ties, Return to user to manually resolve.
                resolved.loc[row, col] = max(set(values), key=values.count)
        
        return resolved

    def setup_widget(self):
        ### grid widget construction:
        grid_widget = qgrid.show_grid(self)
        def handle_cell_edited(event, grid_widget):
            index, column, new_value = event['index'], event['column'], event['new']
            self.loc[index, column] = new_value 

        grid_widget.on('cell_edited', handle_cell_edited)
        self.grid_widget = grid_widget
        

        #refresh button
        refresh_button = Button(description='Refresh')
        refresh_button.on_click(self.refresh)

        #commit button
        commit_button = Button(description='Commit')
        commit_button.on_click(self.commit)

        def get_widget():
            self.refresh()
            return VBox([
                        HBox([refresh_button,commit_button]),
                        grid_widget
                ])
        self.get_widget = get_widget


    def share(self):
        if not self.url:
            id = self.db_client.db.datasets.insert({'data': self.to_csv()})
            self.url = f"http://0.0.0.0:3000/dataset/{id}"
            self.monitor_changes()
        else:
            print('already shared!')

        return self.url
        



## sest up dispaly for ipython notebooks
try:
    from IPython.core.getipython import get_ipython
    from IPython.display import display
except ImportError:
    raise ImportError('This feature requires IPython 1.0+')

get_ipython().display_formatter.ipython_display_formatter.for_type(CollaborativeDataFrame, lambda cdf: display(cdf.get_widget()))
