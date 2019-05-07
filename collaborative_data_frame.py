import pandas as pd
import qgrid.grid

from pymongo import MongoClient
from io import StringIO
from bson.objectid import ObjectId
from bson.timestamp import Timestamp
import threading
import time


from ipywidgets.widgets import Button, VBox, HBox


class CollaborativeDataFrame(pd.DataFrame):
    def __init__(self, data, *args, **kwargs):
        url = None
        id = None
        db_client = MongoClient('mongodb://localhost:27017,localhost:27018,localhost:27019/{db}?replicaSet=my-mongo-set')
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
        self.id = id
        self.username = '' or kwargs.get('username', None)
        self.original_df = df

        if self.url:
            self.monitor_changes()

        self.setup_widget()

    def monitor_changes(self):
        def get_dataset_timestamp():
            # logicfrom https://github.com/nswbmw/objectid-to-timestamp
            seconds = int(objectId[0:8], 16)
            increament = math.floor(int(objectId[-6:], 16) / 16777.217)
            return Timestamp(seconds, Timestamp)

        def handle_changes():
            with self.db_client.db[id].watch(start_at_operation_time=get_dataset_timestamp) as stream:
                for change in stream:
                    # TODO Handle downloads 

        def handle_uploads():
            while True:
                #TODO Handle uploads
                time.sleep(1)

        threading.Thread(target=handle_changes).start()
        threading.Thread(target=handle_uploads).start()

    def commit(self, *args, **kwargs):
        print('will commit here') 

    def refresh(self, *args, **kwargs):
        self.grid_widget.df = self

    def list_my_updates(self):
        return self.mask(self == self.original_df).stack()

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
